import "server-only";

import { and, eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  rentalInspections,
  rentalPickupChecklists,
  securityDeposits,
  vehicles,
} from "@/lib/db/schema";
import { auditOperationsEvent } from "@/lib/operations/audit";
import { assertVehicleAssignment } from "@/lib/operations/booking-guards";
import {
  lockOperationalAllocation,
  lockOperationalBooking,
  lockOperationalVehicle,
  transitionAllocationStatus,
} from "@/lib/operations/allocation-transitions";
import { OperationsError } from "@/lib/operations/errors";
import { transitionBookingStatus } from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";

function depositReadyForCheckout(
  deposit: typeof securityDeposits.$inferSelect,
  requiredAmount: number,
) {
  if (requiredAmount <= 0) {
    return deposit.status === "not_required";
  }
  return ["collected", "held", "partially_collected"].includes(deposit.status);
}

export async function checkoutVehicle(input: { bookingId: string; staffId: string }) {
  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }
    if (booking.status !== "ready") {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "A pickup inspection is required before handover.",
      );
    }
    if (!booking.vehicleId || !booking.vehicleAllocationId) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "This booking does not have an assigned vehicle.",
      );
    }

    const allocation = await lockOperationalAllocation(tx, booking.vehicleAllocationId);
    await assertVehicleAssignment(booking, allocation);
    if (!allocation || allocation.status !== "ready") {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Vehicle allocation must be ready before handover.",
      );
    }

    const [pickupInspection] = await tx
      .select()
      .from(rentalInspections)
      .where(
        and(
          eq(rentalInspections.bookingId, booking.id),
          eq(rentalInspections.inspectionType, "pickup"),
        ),
      )
      .limit(1);

    if (!pickupInspection?.completedAt) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "A pickup inspection is required before handover.",
      );
    }

    const [deposit] = await tx
      .select()
      .from(securityDeposits)
      .where(eq(securityDeposits.bookingId, booking.id))
      .limit(1);

    if (!deposit || !depositReadyForCheckout(deposit, booking.securityDepositRequired)) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Security deposit status must be recorded before handover.",
      );
    }

    const [checklist] = await tx
      .select()
      .from(rentalPickupChecklists)
      .where(eq(rentalPickupChecklists.bookingId, booking.id))
      .limit(1);

    if (!checklist?.securityDepositRecorded && booking.securityDepositRequired > 0) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Security deposit status must be recorded before handover.",
      );
    }

    const vehicle = await lockOperationalVehicle(tx, booking.vehicleId);
    if (!vehicle || vehicle.status === "inactive" || vehicle.status === "maintenance") {
      throw new OperationsError(
        "VEHICLE_UNAVAILABLE",
        "This vehicle is currently unavailable.",
      );
    }

    await transitionAllocationStatus(tx, {
      allocationId: allocation.id,
      fromStatus: "ready",
      toStatus: "checked_out",
    });

    await transitionBookingStatus(tx, {
      bookingId: booking.id,
      fromStatus: "ready",
      toStatus: "checked_out",
      actorType: "staff",
      actorId: input.staffId,
      reason: "Vehicle handed over to customer.",
      metadata: { vehicleId: booking.vehicleId },
    });

    await tx
      .update(vehicles)
      .set({ status: "rented" })
      .where(eq(vehicles.id, booking.vehicleId));
  });

  await auditOperationsEvent({
    staffId: input.staffId,
    action: "vehicle_checked_out",
    entityType: "booking",
    entityId: input.bookingId,
  });

  log("info", "vehicle_checkout", { bookingId: input.bookingId });

  const { notifyVehicleCollected } = await import("@/lib/operations/notify");
  await notifyVehicleCollected(input.bookingId);
}
