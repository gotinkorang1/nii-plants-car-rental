import "server-only";

import { and, eq, gt, inArray, or, sql } from "drizzle-orm";

import { BookingError, mapHoldError } from "@/lib/booking/errors";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { tryGetDb } from "@/lib/db";
import { vehicleAllocations, vehicles } from "@/lib/db/schema";
import { log } from "@/lib/logger";
import { expireVehicleHolds } from "@/lib/availability/expire-holds";

export async function listFutureBlockingAllocations(vehicleId: string) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  await expireVehicleHolds();

  return db
    .select({
      id: vehicleAllocations.id,
      allocationType: vehicleAllocations.allocationType,
      status: vehicleAllocations.status,
      startAt: vehicleAllocations.startAt,
      endAt: vehicleAllocations.endAt,
      reason: vehicleAllocations.reason,
    })
    .from(vehicleAllocations)
    .where(
      and(
        eq(vehicleAllocations.vehicleId, vehicleId),
        gt(vehicleAllocations.endAt, sql`now()`),
        or(
          inArray(vehicleAllocations.status, [
            "confirmed",
            "ready",
            "checked_out",
          ]),
          and(
            eq(vehicleAllocations.status, "hold"),
            gt(vehicleAllocations.expiresAt, sql`now()`),
          ),
        ),
      ),
    );
}

export async function createManualBlock(input: {
  vehicleId: string;
  startAt: Date;
  endAt: Date;
  reason: string;
  createdBy: string | null;
  allocationType?: "manual_block" | "maintenance";
}) {
  const db = tryGetDb();
  if (!db) {
    throw new Error("The database is not configured.");
  }

  if (input.startAt.getTime() >= input.endAt.getTime()) {
    throw new BookingError(
      "INVALID_TIME_RANGE",
      "Block end must be after the start time.",
    );
  }

  await expireVehicleHolds();

  const [vehicle] = await db
    .select({ id: vehicles.id, internalCode: vehicles.internalCode })
    .from(vehicles)
    .where(eq(vehicles.id, input.vehicleId))
    .limit(1);

  if (!vehicle) {
    throw new BookingError("VEHICLE_UNAVAILABLE", "Choose a valid vehicle.");
  }

  try {
    const [created] = await db
      .insert(vehicleAllocations)
      .values({
        vehicleId: input.vehicleId,
        allocationType: input.allocationType ?? "manual_block",
        status: "confirmed",
        startAt: input.startAt,
        endAt: input.endAt,
        reason: input.reason,
        createdBy: input.createdBy,
      })
      .returning({ id: vehicleAllocations.id });

    log("info", "manual_block_created", {
      allocationId: created?.id,
      vehicleId: input.vehicleId,
    });

    await writeAuditLog({
      actorType: "staff",
      actorId: input.createdBy,
      action: "availability.manual_block.create",
      entityType: "vehicle_allocation",
      entityId: created?.id,
      metadata: {
        vehicleId: input.vehicleId,
        allocationType: input.allocationType ?? "manual_block",
      },
    });

    return created;
  } catch (error) {
    throw mapHoldError(error);
  }
}

export async function cancelManualBlock(input: {
  allocationId: string;
  actorId: string | null;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new Error("The database is not configured.");
  }

  const [updated] = await db
    .update(vehicleAllocations)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(vehicleAllocations.id, input.allocationId),
        inArray(vehicleAllocations.allocationType, [
          "manual_block",
          "maintenance",
        ]),
      ),
    )
    .returning({ id: vehicleAllocations.id });

  await writeAuditLog({
    actorType: "staff",
    actorId: input.actorId,
    action: "availability.manual_block.cancel",
    entityType: "vehicle_allocation",
    entityId: input.allocationId,
  });

  return updated;
}
