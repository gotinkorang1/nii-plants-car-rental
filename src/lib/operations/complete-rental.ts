import "server-only";

import { and, eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  rentalInspections,
  securityDeposits,
  vehicles,
} from "@/lib/db/schema";
import { createMaintenanceFromReturn } from "@/lib/maintenance/create-maintenance";
import { OperationsError } from "@/lib/operations/errors";
import { auditOperationsEvent } from "@/lib/operations/audit";
import { assertVehicleAssignment } from "@/lib/operations/booking-guards";
import {
  lockOperationalAllocation,
  lockOperationalBooking,
  lockOperationalVehicle,
  transitionAllocationStatus,
} from "@/lib/operations/allocation-transitions";
import { transitionBookingStatus } from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";

export async function completeRental(input: { bookingId: string; staffId: string }) {
  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  let maintenanceRequired = false;

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }
    if (booking.status !== "checked_out") {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Return inspection must be completed before finishing this rental.",
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
    if (!allocation || allocation.status !== "checked_out") {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Vehicle allocation must be checked out before completion.",
      );
    }

    const [returnInspection] = await tx
      .select()
      .from(rentalInspections)
      .where(
        and(
          eq(rentalInspections.bookingId, booking.id),
          eq(rentalInspections.inspectionType, "return"),
        ),
      )
      .limit(1);

    if (!returnInspection?.completedAt || returnInspection.odometer === null) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Return inspection must be completed before finishing this rental.",
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

    if (
      pickupInspection?.completedAt &&
      pickupInspection.odometer !== null &&
      returnInspection.odometer < pickupInspection.odometer
    ) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "The return odometer cannot be lower than the pickup odometer.",
      );
    }

    const [deposit] = await tx
      .select()
      .from(securityDeposits)
      .where(eq(securityDeposits.bookingId, booking.id))
      .limit(1);

    if (!deposit) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Security deposit status must be recorded before completion.",
      );
    }

    maintenanceRequired = returnInspection.maintenanceRequired;

    await transitionAllocationStatus(tx, {
      allocationId: allocation.id,
      fromStatus: "checked_out",
      toStatus: "completed",
    });

    await transitionBookingStatus(tx, {
      bookingId: booking.id,
      fromStatus: "checked_out",
      toStatus: "completed",
      actorType: "staff",
      actorId: input.staffId,
      reason: "Rental completed after return inspection.",
      metadata: {
        vehicleId: booking.vehicleId,
        distanceKm:
          pickupInspection?.odometer !== null && pickupInspection?.odometer !== undefined
            ? returnInspection.odometer - pickupInspection.odometer
            : null,
      },
    });

    const vehicle = await lockOperationalVehicle(tx, booking.vehicleId);
    if (!vehicle) {
      throw new OperationsError("VEHICLE_UNAVAILABLE", "Assigned vehicle was not found.");
    }

    if (maintenanceRequired || returnInspection.generalCondition === "damage_detected") {
      await tx
        .update(vehicles)
        .set({ status: "maintenance" })
        .where(eq(vehicles.id, booking.vehicleId));

      await createMaintenanceFromReturn(tx, {
        vehicleId: booking.vehicleId,
        staffId: input.staffId,
        returnInspection,
        booking,
      });
    } else {
      await tx
        .update(vehicles)
        .set({ status: "available" })
        .where(eq(vehicles.id, booking.vehicleId));
    }
  });

  await auditOperationsEvent({
    staffId: input.staffId,
    action: "rental_completed",
    entityType: "booking",
    entityId: input.bookingId,
    metadata: { maintenanceRequired },
  });

  log("info", "return_completed", { bookingId: input.bookingId, maintenanceRequired });

  const { notifyRentalCompleted } = await import("@/lib/operations/notify");
  await notifyRentalCompleted(input.bookingId);
}
