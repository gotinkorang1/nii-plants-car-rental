import "server-only";

import { eq } from "drizzle-orm";

import { auditBookingEvent } from "@/lib/bookings/transition-booking-status";
import { tryGetDb } from "@/lib/db";
import {
  bookings,
  rentalPickupChecklists,
  securityDeposits,
} from "@/lib/db/schema";
import { OperationsError } from "@/lib/operations/errors";
import {
  lockOperationalAllocation,
  lockOperationalBooking,
  lockOperationalVehicle,
  transitionAllocationStatus,
} from "@/lib/operations/allocation-transitions";
import { transitionBookingStatus } from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";

export async function markBookingReady(input: {
  bookingId: string;
  staffId: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }
    if (booking.status !== "confirmed") {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "This booking is no longer eligible for pickup preparation.",
      );
    }
    if (!booking.vehicleId || !booking.vehicleAllocationId) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Assign a physical vehicle before marking ready.",
      );
    }

    const allocation = await lockOperationalAllocation(tx, booking.vehicleAllocationId);
    if (!allocation || allocation.status !== "confirmed") {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Vehicle allocation must be confirmed before marking ready.",
      );
    }
    if (allocation.vehicleId !== booking.vehicleId) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Assigned vehicle does not match the booking allocation.",
      );
    }

    const vehicle = await lockOperationalVehicle(tx, booking.vehicleId);
    if (!vehicle || vehicle.status === "inactive") {
      throw new OperationsError(
        "VEHICLE_UNAVAILABLE",
        "This vehicle is currently unavailable.",
      );
    }

    await transitionAllocationStatus(tx, {
      allocationId: allocation.id,
      fromStatus: "confirmed",
      toStatus: "ready",
    });

    await transitionBookingStatus(tx, {
      bookingId: booking.id,
      fromStatus: "confirmed",
      toStatus: "ready",
      actorType: "staff",
      actorId: input.staffId,
      reason: "Vehicle prepared for pickup.",
    });
  });

  await auditBookingEvent({
    actorType: "staff",
    actorId: input.staffId,
    action: "booking_marked_ready",
    bookingId: input.bookingId,
  });

  log("info", "pickup_completed", { bookingId: input.bookingId, stage: "ready" });

  const { notifyVehicleReady } = await import("@/lib/operations/notify");
  await notifyVehicleReady(input.bookingId);
}

export async function ensureSecurityDepositRecord(
  tx: Parameters<Parameters<NonNullable<ReturnType<typeof tryGetDb>>["transaction"]>[0]>[0],
  booking: typeof bookings.$inferSelect,
  staffId: string,
) {
  const [existing] = await tx
    .select()
    .from(securityDeposits)
    .where(eq(securityDeposits.bookingId, booking.id))
    .limit(1);

  if (existing) {
    return existing;
  }

  const status =
    booking.securityDepositRequired <= 0 ? ("not_required" as const) : ("required" as const);

  const [created] = await tx
    .insert(securityDeposits)
    .values({
      bookingId: booking.id,
      requiredAmount: booking.securityDepositRequired,
      collectedAmount: 0,
      status,
      recordedBy: staffId,
    })
    .returning();

  return created;
}

export async function ensurePickupChecklist(
  tx: Parameters<Parameters<NonNullable<ReturnType<typeof tryGetDb>>["transaction"]>[0]>[0],
  bookingId: string,
) {
  const [existing] = await tx
    .select()
    .from(rentalPickupChecklists)
    .where(eq(rentalPickupChecklists.bookingId, bookingId))
    .limit(1);

  if (existing) {
    return existing;
  }

  const [created] = await tx
    .insert(rentalPickupChecklists)
    .values({ bookingId })
    .returning();

  return created;
}
