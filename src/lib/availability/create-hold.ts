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
  vehicleClassId: string;
  vehicleModelId: string | null;
  pickupAt: Date;
  returnAt: Date;
  quoteId: string;
  holdMinutes: number;
  createdBy?: string | null;
};

export type VehicleHoldResult = {
  allocationId: string;
  vehicleId: string;
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
    const vehicleId = record.vehicle_id ?? record.vehicleId;
    if (typeof allocationId !== "string" || typeof vehicleId !== "string") {
      return [];
    }
    return [{ allocationId, vehicleId }];
  });
}

export async function createVehicleHold(
  client: HoldClient,
  input: CreateVehicleHoldInput,
): Promise<VehicleHoldResult> {
  log("info", "hold_attempt", {
    vehicleClassId: input.vehicleClassId,
    vehicleModelId: input.vehicleModelId,
    quoteId: input.quoteId,
    pickupAt: input.pickupAt.toISOString(),
    returnAt: input.returnAt.toISOString(),
  });

  try {
    const result = await client.execute(sql`
      SELECT allocation_id, vehicle_id
      FROM public.create_vehicle_hold(
        ${input.vehicleClassId}::uuid,
        ${input.vehicleModelId}::uuid,
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
      vehicleClassId: input.vehicleClassId,
      unavailable: isVehicleUnavailableError(error),
    });
    throw mapHoldError(error);
  }
}
