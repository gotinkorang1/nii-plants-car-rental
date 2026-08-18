import "server-only";

import { and, eq, gt, inArray, or, sql } from "drizzle-orm";

import { BookingError, mapHoldError } from "@/lib/booking/errors";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import type { AppTransaction } from "@/lib/db";
import {
  bookings,
  maintenanceRecords,
  rentalInspections,
  vehicleAllocations,
  vehicles,
} from "@/lib/db/schema";
import type { maintenanceTypeEnum } from "@/lib/db/schema/enums";
import { log } from "@/lib/logger";

type MaintenanceType = (typeof maintenanceTypeEnum.enumValues)[number];

async function findConflictingBookingAllocation(
  tx: AppTransaction,
  vehicleId: string,
  startAt: Date,
  endAt: Date,
  excludeAllocationId?: string,
) {
  const rows = await tx
    .select({
      id: vehicleAllocations.id,
      bookingId: vehicleAllocations.bookingId,
      status: vehicleAllocations.status,
    })
    .from(vehicleAllocations)
    .where(
      and(
        eq(vehicleAllocations.vehicleId, vehicleId),
        eq(vehicleAllocations.allocationType, "booking"),
        sql`${vehicleAllocations.startAt} < ${endAt.toISOString()}::timestamptz`,
        sql`${vehicleAllocations.endAt} > ${startAt.toISOString()}::timestamptz`,
        inArray(vehicleAllocations.status, ["confirmed", "ready", "checked_out"]),
        excludeAllocationId
          ? sql`${vehicleAllocations.id} <> ${excludeAllocationId}::uuid`
          : sql`true`,
      ),
    );

  return rows[0] ?? null;
}

export async function createMaintenanceRecord(input: {
  vehicleId: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string | null;
  startAt: Date;
  endAt: Date;
  odometerAtStart?: number | null;
  cost?: number | null;
  providerName?: string | null;
  notes?: string | null;
  staffId: string;
}) {
  if (input.startAt.getTime() >= input.endAt.getTime()) {
    throw new BookingError("INVALID_TIME_RANGE", "Maintenance end must be after the start.");
  }
  if (input.odometerAtStart !== undefined && input.odometerAtStart !== null && input.odometerAtStart < 0) {
    throw new BookingError("INVALID_STATUS_TRANSITION", "Odometer must be zero or greater.");
  }
  if (input.cost !== undefined && input.cost !== null && input.cost < 0) {
    throw new BookingError("INVALID_STATUS_TRANSITION", "Cost must be zero or greater.");
  }

  const db = (await import("@/lib/db")).tryGetDb();
  if (!db) {
    throw new Error("The database is not configured.");
  }

  const record = await db.transaction(async (tx) => {
    const conflict = await findConflictingBookingAllocation(
      tx,
      input.vehicleId,
      input.startAt,
      input.endAt,
    );
    if (conflict) {
      throw new BookingError(
        "VEHICLE_UNAVAILABLE",
        "This maintenance period conflicts with an existing reservation.",
      );
    }

    let allocationId: string | undefined;
    try {
      const [allocation] = await tx
        .insert(vehicleAllocations)
        .values({
          vehicleId: input.vehicleId,
          allocationType: "maintenance",
          status: "confirmed",
          startAt: input.startAt,
          endAt: input.endAt,
          reason: input.title,
          createdBy: input.staffId,
        })
        .returning({ id: vehicleAllocations.id });
      allocationId = allocation?.id;
    } catch (error) {
      throw mapHoldError(error);
    }

    const [created] = await tx
      .insert(maintenanceRecords)
      .values({
        vehicleId: input.vehicleId,
        vehicleAllocationId: allocationId,
        maintenanceType: input.maintenanceType,
        status: "scheduled",
        title: input.title.trim(),
        description: input.description ?? null,
        startAt: input.startAt,
        endAt: input.endAt,
        odometerAtStart: input.odometerAtStart ?? null,
        cost: input.cost ?? null,
        providerName: input.providerName ?? null,
        notes: input.notes ?? null,
        createdBy: input.staffId,
      })
      .returning();

    await tx
      .update(vehicles)
      .set({ status: "maintenance" })
      .where(eq(vehicles.id, input.vehicleId));

    return created;
  });

  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: "maintenance_created",
    entityType: "maintenance_record",
    entityId: record?.id,
    metadata: { vehicleId: input.vehicleId },
  });

  log("info", "maintenance_block_created", {
    maintenanceId: record?.id,
    vehicleId: input.vehicleId,
  });

  return record;
}

export async function createMaintenanceFromReturn(
  tx: AppTransaction,
  input: {
    vehicleId: string;
    staffId: string;
    returnInspection: typeof rentalInspections.$inferSelect;
    booking: typeof bookings.$inferSelect;
  },
) {
  const startAt = new Date();
  const endAt = new Date(input.booking.returnAt.getTime() + 24 * 60 * 60 * 1000);

  const [allocation] = await tx
    .insert(vehicleAllocations)
    .values({
      vehicleId: input.vehicleId,
      bookingId: input.booking.id,
      allocationType: "maintenance",
      status: "confirmed",
      startAt,
      endAt,
      reason: input.returnInspection.damageSummary ?? "Return inspection maintenance",
      createdBy: input.staffId,
    })
    .returning({ id: vehicleAllocations.id });

  const [record] = await tx
    .insert(maintenanceRecords)
    .values({
      vehicleId: input.vehicleId,
      vehicleAllocationId: allocation?.id,
      maintenanceType: "repair",
      status: "scheduled",
      title: "Post-return inspection maintenance",
      description: input.returnInspection.damageSummary,
      startAt,
      endAt,
      odometerAtStart: input.returnInspection.odometer,
      notes: input.returnInspection.staffNotes,
      createdBy: input.staffId,
    })
    .returning({ id: maintenanceRecords.id });

  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: "maintenance_created",
    entityType: "maintenance_record",
    entityId: record?.id,
    metadata: { bookingId: input.booking.id, source: "return_inspection" },
  });
}

export async function cancelMaintenanceRecord(input: {
  maintenanceId: string;
  staffId: string;
}) {
  const db = (await import("@/lib/db")).tryGetDb();
  if (!db) {
    throw new Error("The database is not configured.");
  }

  await db.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.id, input.maintenanceId))
      .for("update");

    if (!record || record.status === "cancelled" || record.status === "completed") {
      throw new BookingError("INVALID_STATUS_TRANSITION", "Maintenance cannot be cancelled.");
    }

    if (record.vehicleAllocationId) {
      await tx
        .update(vehicleAllocations)
        .set({ status: "cancelled" })
        .where(eq(vehicleAllocations.id, record.vehicleAllocationId));
    }

    await tx
      .update(maintenanceRecords)
      .set({ status: "cancelled" })
      .where(eq(maintenanceRecords.id, record.id));

    const futureBlocks = await tx
      .select({ id: vehicleAllocations.id })
      .from(vehicleAllocations)
      .where(
        and(
          eq(vehicleAllocations.vehicleId, record.vehicleId),
          inArray(vehicleAllocations.status, ["confirmed", "ready", "checked_out", "hold"]),
          or(
            eq(vehicleAllocations.allocationType, "maintenance"),
            eq(vehicleAllocations.allocationType, "manual_block"),
          ),
          gt(vehicleAllocations.endAt, sql`now()`),
        ),
      );

    if (futureBlocks.length === 0) {
      await tx
        .update(vehicles)
        .set({ status: "available" })
        .where(eq(vehicles.id, record.vehicleId));
    }
  });

  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: "maintenance_cancelled",
    entityType: "maintenance_record",
    entityId: input.maintenanceId,
  });
}

export async function completeMaintenanceRecord(input: {
  maintenanceId: string;
  staffId: string;
}) {
  const db = (await import("@/lib/db")).tryGetDb();
  if (!db) {
    throw new Error("The database is not configured.");
  }

  await db.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.id, input.maintenanceId))
      .for("update");

    if (!record || !["scheduled", "in_progress"].includes(record.status)) {
      throw new BookingError("INVALID_STATUS_TRANSITION", "Maintenance cannot be completed.");
    }

    if (record.vehicleAllocationId) {
      await tx
        .update(vehicleAllocations)
        .set({ status: "completed", endAt: new Date() })
        .where(eq(vehicleAllocations.id, record.vehicleAllocationId));
    }

    await tx
      .update(maintenanceRecords)
      .set({
        status: "completed",
        completedAt: new Date(),
        completedBy: input.staffId,
      })
      .where(eq(maintenanceRecords.id, record.id));

    const activeBlocks = await tx
      .select({ id: vehicleAllocations.id })
      .from(vehicleAllocations)
      .where(
        and(
          eq(vehicleAllocations.vehicleId, record.vehicleId),
          inArray(vehicleAllocations.status, ["confirmed", "ready", "checked_out", "hold"]),
          or(
            eq(vehicleAllocations.allocationType, "maintenance"),
            eq(vehicleAllocations.allocationType, "manual_block"),
          ),
          gt(vehicleAllocations.endAt, sql`now()`),
        ),
      );

    if (activeBlocks.length === 0) {
      await tx
        .update(vehicles)
        .set({ status: "available" })
        .where(eq(vehicles.id, record.vehicleId));
    }
  });

  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: "maintenance_completed",
    entityType: "maintenance_record",
    entityId: input.maintenanceId,
  });
}

export async function startMaintenanceRecord(input: {
  maintenanceId: string;
  staffId: string;
}) {
  const db = (await import("@/lib/db")).tryGetDb();
  if (!db) {
    throw new Error("The database is not configured.");
  }

  await db
    .update(maintenanceRecords)
    .set({ status: "in_progress" })
    .where(
      and(
        eq(maintenanceRecords.id, input.maintenanceId),
        eq(maintenanceRecords.status, "scheduled"),
      ),
    );

  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: "maintenance_started",
    entityType: "maintenance_record",
    entityId: input.maintenanceId,
  });
}
