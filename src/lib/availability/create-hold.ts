import "server-only";

import { sql } from "drizzle-orm";

import {
  BookingError,
  isVehicleUnavailableError,
  mapHoldError,
} from "@/lib/booking/errors";
import { log } from "@/lib/logger";

type HoldClient = {
  execute: (query: ReturnType<typeof sql>) => Promise<unknown>;
};

export type CreateVehicleHoldInput = {
  vehicleModelId: string;
  pickupLocationId: string;
  pickupAt: Date;
  returnAt: Date;
  quoteId: string;
  holdMinutes: number;
  createdBy?: string | null;
};

export type VehicleHoldResult = {
  allocationId: string;
  inventorySlotId: string;
  vehicleId: string | null;
};

function readHoldRows(result: unknown): VehicleHoldResult[] {
  const rows = Array.isArray(result)
    ? result
    : result &&
        typeof result === "object" &&
        "rows" in result &&
        Array.isArray((result as { rows: unknown }).rows)
      ? (result as { rows: unknown[] }).rows
      : [];

  return rows.flatMap((row) => {
    if (!row || typeof row !== "object") {
      return [];
    }
    const record = row as Record<string, unknown>;
    const allocationId = record.allocation_id ?? record.allocationId;
    const inventorySlotId = record.inventory_slot_id ?? record.inventorySlotId;
    const vehicleId = record.vehicle_id ?? record.vehicleId ?? null;
    if (
      typeof allocationId !== "string" ||
      typeof inventorySlotId !== "string" ||
      (vehicleId !== null && typeof vehicleId !== "string")
    ) {
      return [];
    }
    return [{
      allocationId,
      inventorySlotId,
      vehicleId: vehicleId as string | null,
    }];
  });
}

export async function createVehicleHold(
  client: HoldClient,
  input: CreateVehicleHoldInput,
): Promise<VehicleHoldResult> {
  log("info", "hold_attempt", {
    vehicleModelId: input.vehicleModelId,
    pickupLocationId: input.pickupLocationId,
    quoteId: input.quoteId,
    pickupAt: input.pickupAt.toISOString(),
    returnAt: input.returnAt.toISOString(),
  });

  try {
    const result = await client.execute(sql`
      SELECT allocation_id, inventory_slot_id, vehicle_id
      FROM public.create_vehicle_hold(
        ${input.vehicleModelId}::uuid,
        ${input.pickupLocationId}::uuid,
        ${input.pickupAt.toISOString()}::timestamptz,
        ${input.returnAt.toISOString()}::timestamptz,
        ${input.quoteId}::uuid,
        ${input.holdMinutes}::integer,
        ${input.createdBy ?? null}::uuid
      )
    `);

    const [hold] = readHoldRows(result);
    if (!hold) {
      throw new BookingError(
        "VEHICLE_UNAVAILABLE",
        "That vehicle was just reserved for these dates. Please choose another available option.",
      );
    }

    log("info", "hold_created", {
      allocationId: hold.allocationId,
      quoteId: input.quoteId,
    });

    return hold;
  } catch (error) {
    log("warn", "hold_failed", {
      quoteId: input.quoteId,
      vehicleModelId: input.vehicleModelId,
      unavailable: isVehicleUnavailableError(error),
    });
    throw mapHoldError(error);
  }
}
