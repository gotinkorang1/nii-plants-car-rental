import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { BookingError } from "@/lib/booking/errors";
import { tryGetDb } from "@/lib/db";
import {
  locations,
  vehicleAllocations,
  vehicleClasses,
  vehicleImages,
  vehicleModels,
  vehicles,
} from "@/lib/db/schema";
import { toPublicVehicleModel } from "@/lib/fleet/map-public-model";
import { log } from "@/lib/logger";
import { calculateChargeableDays } from "@/lib/pricing/calculate-chargeable-days";
import type { AvailabilitySearchValues } from "@/lib/validation/availability";

export type AvailableModelResult = {
  modelId: string;
  classId: string;
  make: string;
  model: string;
  slug: string;
  className: string;
  seats: number;
  luggage: number;
  transmission: "automatic" | "manual";
  airConditioning: boolean;
  image: { url: string | null; altText: string } | null;
  dailyRate: number;
  securityDepositRequired: number;
  chargeableDays: number;
  estimatedTotal: number;
  availableCount: number;
};

export async function resolveSearchLocations(input: {
  pickupLocation: string;
  returnLocation: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new BookingError(
      "INVALID_LOCATION",
      "Pickup and return locations are not available yet.",
    );
  }

  const rows = await db
    .select({
      id: locations.id,
      slug: locations.slug,
      name: locations.name,
      active: locations.active,
    })
    .from(locations)
    .where(
      inArray(locations.slug, [input.pickupLocation, input.returnLocation]),
    );

  const pickup = rows.find((row) => row.slug === input.pickupLocation);
  const dropoff = rows.find((row) => row.slug === input.returnLocation);

  if (!pickup?.active || !dropoff?.active) {
    throw new BookingError(
      "INVALID_LOCATION",
      "Choose valid pickup and return locations.",
    );
  }

  return { pickup, dropoff };
}

export async function getAvailableModels(
  input: Pick<
    AvailabilitySearchValues,
    "pickupAt" | "returnAt" | "pickupLocation" | "returnLocation"
  >,
): Promise<AvailableModelResult[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  await resolveSearchLocations({
    pickupLocation: input.pickupLocation,
    returnLocation: input.returnLocation,
  });

  const chargeableDays = calculateChargeableDays(input.pickupAt, input.returnAt);

  const occupancy = sql<number>`(
    SELECT count(*)::int
    FROM ${vehicles}
    WHERE ${vehicles.vehicleClassId} = ${vehicleClasses.id}
      AND ${vehicles.status} = 'available'
      AND NOT EXISTS (
        SELECT 1
        FROM ${vehicleAllocations}
        WHERE ${vehicleAllocations.vehicleId} = ${vehicles.id}
          AND ${vehicleAllocations.startAt} < ${input.returnAt.toISOString()}::timestamptz
          AND ${vehicleAllocations.endAt} > ${input.pickupAt.toISOString()}::timestamptz
          AND (
            ${vehicleAllocations.status} IN ('confirmed', 'ready', 'checked_out')
            OR (
              ${vehicleAllocations.status} = 'hold'
              AND ${vehicleAllocations.expiresAt} IS NOT NULL
              AND ${vehicleAllocations.expiresAt} > now()
            )
          )
      )
  )`;

  const rows = await db
    .select({
      model: vehicleModels,
      vehicleClass: vehicleClasses,
      availableCount: occupancy,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .where(
      and(eq(vehicleModels.published, true), eq(vehicleClasses.active, true)),
    )
    .orderBy(vehicleModels.make, vehicleModels.model);

  const availableRows = rows.filter((row) => row.availableCount > 0);
  const modelIds = availableRows.map((row) => row.model.id);
  const images =
    modelIds.length === 0
      ? []
      : await db
          .select()
          .from(vehicleImages)
          .where(inArray(vehicleImages.vehicleModelId, modelIds));

  const imageMap = new Map<string, (typeof vehicleImages.$inferSelect)[]>();
  for (const image of images) {
    const list = imageMap.get(image.vehicleModelId) ?? [];
    list.push(image);
    imageMap.set(image.vehicleModelId, list);
  }

  log("info", "availability_search", {
    pickupAt: input.pickupAt.toISOString(),
    returnAt: input.returnAt.toISOString(),
    resultCount: availableRows.length,
  });

  return availableRows.map((row) => {
    const publicModel = toPublicVehicleModel(
      row.model,
      row.vehicleClass,
      imageMap.get(row.model.id) ?? [],
    );
    const dailyRate = row.vehicleClass.defaultDailyRate;

    return {
      modelId: row.model.id,
      classId: row.vehicleClass.id,
      make: row.model.make,
      model: row.model.model,
      slug: row.model.slug,
      className: row.vehicleClass.name,
      seats: row.model.seats,
      luggage: row.model.luggage,
      transmission: row.model.transmission,
      airConditioning: row.model.airConditioning,
      image: publicModel.primaryImage
        ? {
            url: publicModel.primaryImage.url,
            altText: publicModel.primaryImage.altText,
          }
        : null,
      dailyRate,
      securityDepositRequired: row.vehicleClass.defaultSecurityDeposit,
      chargeableDays,
      estimatedTotal: dailyRate * chargeableDays,
      availableCount: row.availableCount,
    };
  });
}
