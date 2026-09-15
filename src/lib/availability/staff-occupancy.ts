import "server-only";

import { and, eq, gt, inArray, lt } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  vehicleAllocations,
  vehicleClasses,
  vehicleModels,
  vehicles,
} from "@/lib/db/schema";

export type OccupancyLabel =
  | "Available"
  | "Held"
  | "Reserved"
  | "Checked out"
  | "Maintenance"
  | "Blocked"
  | "Inactive";

export type StaffVehicleOccupancy = {
  vehicleId: string;
  internalCode: string;
  make: string;
  model: string;
  className: string;
  status: string;
  occupancy: OccupancyLabel;
  allocations: Array<{
    id: string;
    allocationType: string;
    status: string;
    startAt: Date;
    endAt: Date;
    expiresAt: Date | null;
    reason: string | null;
  }>;
};

function occupancyFor(input: {
  vehicleStatus: string;
  allocations: StaffVehicleOccupancy["allocations"];
}): OccupancyLabel {
  if (input.vehicleStatus === "inactive") {
    return "Inactive";
  }
  if (input.vehicleStatus === "maintenance") {
    return "Maintenance";
  }

  const now = Date.now();
  const live = input.allocations.filter((allocation) => {
    if (allocation.status === "cancelled" || allocation.status === "completed") {
      return false;
    }
    if (allocation.status === "expired") {
      return false;
    }
    if (
      allocation.status === "hold" &&
      (!allocation.expiresAt || allocation.expiresAt.getTime() <= now)
    ) {
      return false;
    }
    return true;
  });

  if (live.some((item) => item.status === "checked_out")) {
    return "Checked out";
  }
  if (live.some((item) => item.allocationType === "maintenance")) {
    return "Maintenance";
  }
  if (live.some((item) => item.allocationType === "manual_block")) {
    return "Blocked";
  }
  if (live.some((item) => item.status === "hold")) {
    return "Held";
  }
  if (
    live.some((item) =>
      ["confirmed", "ready"].includes(item.status),
    )
  ) {
    return "Reserved";
  }

  return "Available";
}

export async function listStaffOccupancy(input: {
  startAt: Date;
  endAt: Date;
  classId?: string;
  modelId?: string;
}): Promise<StaffVehicleOccupancy[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const vehicleRows = await db
    .select({
      vehicle: vehicles,
      model: vehicleModels,
      vehicleClass: vehicleClasses,
    })
    .from(vehicles)
    .innerJoin(vehicleModels, eq(vehicles.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(vehicles.vehicleClassId, vehicleClasses.id))
    .where(
      and(
        input.classId ? eq(vehicles.vehicleClassId, input.classId) : undefined,
        input.modelId ? eq(vehicles.vehicleModelId, input.modelId) : undefined,
      ),
    )
    .orderBy(vehicles.internalCode);

  const vehicleIds = vehicleRows.map((row) => row.vehicle.id);
  const allocationRows =
    vehicleIds.length === 0
      ? []
      : await db
          .select()
          .from(vehicleAllocations)
          .where(
            and(
              inArray(vehicleAllocations.vehicleId, vehicleIds),
              lt(vehicleAllocations.startAt, input.endAt),
              gt(vehicleAllocations.endAt, input.startAt),
            ),
          );

  const overlapping = allocationRows.filter(
    (row) =>
      row.startAt.getTime() < input.endAt.getTime() &&
      row.endAt.getTime() > input.startAt.getTime(),
  );

  const byVehicle = new Map<string, typeof overlapping>();
  for (const row of overlapping) {
    if (!row.vehicleId) {
      continue;
    }
    const list = byVehicle.get(row.vehicleId) ?? [];
    list.push(row);
    byVehicle.set(row.vehicleId, list);
  }

  return vehicleRows.map((row) => {
    const allocations = (byVehicle.get(row.vehicle.id) ?? []).map((item) => ({
      id: item.id,
      allocationType: item.allocationType,
      status: item.status,
      startAt: item.startAt,
      endAt: item.endAt,
      expiresAt: item.expiresAt,
      reason: item.reason,
    }));

    return {
      vehicleId: row.vehicle.id,
      internalCode: row.vehicle.internalCode,
      make: row.model.make,
      model: row.model.model,
      className: row.vehicleClass.name,
      status: row.vehicle.status,
      occupancy: occupancyFor({
        vehicleStatus: row.vehicle.status,
        allocations,
      }),
      allocations,
    };
  });
}
