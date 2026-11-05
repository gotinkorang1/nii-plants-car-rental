import "server-only";

import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { tryGetDb } from "@/lib/db";
import { bookings, vehicleAllocations, vehicles } from "@/lib/db/schema";
import { OperationsError } from "@/lib/operations/errors";

export type AssignmentCandidate = {
  expectedModelId: string;
  expectedLocationId: string;
  vehicleModelId: string;
  branchLocationId: string;
  status: "available" | "rented" | "maintenance" | "inactive";
  overlaps: boolean;
};

export function assertAssignableVehicle(candidate: AssignmentCandidate): void {
  if (candidate.vehicleModelId !== candidate.expectedModelId) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "Choose a vehicle from the booked model.");
  }
  if (candidate.branchLocationId !== candidate.expectedLocationId) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "Choose a vehicle from the pickup location.");
  }
  if (candidate.status !== "available") {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "Choose a vehicle that is currently available.");
  }
  if (candidate.overlaps) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "That vehicle is already occupied during this booking.");
  }
}

export async function assignBookingVehicle(input: {
  bookingId: string;
  vehicleId: string;
  staffId: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "The database is not configured.");
  }

  let assignedVehicleCode: string | null = null;

  await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .for("update");
    if (!booking || !booking.vehicleAllocationId) {
      throw new OperationsError("INVALID_STATUS_TRANSITION", "This booking has no active capacity reservation.");
    }

    const [allocation] = await tx
      .select()
      .from(vehicleAllocations)
      .where(eq(vehicleAllocations.id, booking.vehicleAllocationId))
      .for("update");
    if (!allocation || !["hold", "confirmed", "ready"].includes(allocation.status)) {
      throw new OperationsError("INVALID_STATUS_TRANSITION", "This booking is no longer awaiting vehicle assignment.");
    }

    const [vehicle] = await tx
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, input.vehicleId))
      .for("update");
    if (!vehicle) {
      throw new OperationsError("INVALID_STATUS_TRANSITION", "Choose a valid physical vehicle.");
    }
    assertAssignableVehicle({
      expectedModelId: booking.vehicleModelId,
      expectedLocationId: booking.pickupLocationId,
      vehicleModelId: vehicle.vehicleModelId,
      branchLocationId: vehicle.branchLocationId,
      status: vehicle.status,
      overlaps: false,
    });

    const [overlap] = await tx
      .select({ id: vehicleAllocations.id })
      .from(vehicleAllocations)
      .where(
        and(
          eq(vehicleAllocations.vehicleId, vehicle.id),
          ne(vehicleAllocations.id, allocation.id),
          lt(vehicleAllocations.startAt, booking.returnAt),
          gt(vehicleAllocations.endAt, booking.pickupAt),
          inArray(vehicleAllocations.status, ["hold", "confirmed", "ready", "checked_out"]),
        ),
      )
      .limit(1);
    if (overlap) {
      assertAssignableVehicle({
        expectedModelId: booking.vehicleModelId,
        expectedLocationId: booking.pickupLocationId,
        vehicleModelId: vehicle.vehicleModelId,
        branchLocationId: vehicle.branchLocationId,
        status: vehicle.status,
        overlaps: true,
      });
    }

    await tx
      .update(vehicleAllocations)
      .set({ vehicleId: vehicle.id })
      .where(eq(vehicleAllocations.id, allocation.id));
    await tx
      .update(bookings)
      .set({ vehicleId: vehicle.id })
      .where(eq(bookings.id, booking.id));

    assignedVehicleCode = vehicle.internalCode;
  });

  // Write the audit log after the transaction commits. writeAuditLog borrows a
  // connection from the shared pool; on a direct-session DATABASE_URL that pool
  // is a single connection, so calling it inside the transaction above would
  // deadlock waiting for the connection the transaction still holds.
  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: "booking.vehicle.assign",
    entityType: "booking",
    entityId: input.bookingId,
    metadata: { vehicleId: input.vehicleId, internalCode: assignedVehicleCode },
  });
}
