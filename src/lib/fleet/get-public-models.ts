import "server-only";

import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  vehicleClasses,
  vehicleImages,
  vehicleModels,
} from "@/lib/db/schema";
import type { PublicFleetFilters } from "@/lib/fleet/filters";
import { toPublicVehicleModel } from "@/lib/fleet/map-public-model";
import type { PublicVehicleModel } from "@/lib/fleet/public-types";

export async function getPublicModels(
  filters: PublicFleetFilters = {},
): Promise<PublicVehicleModel[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const conditions = [
    eq(vehicleModels.published, true),
    eq(vehicleClasses.active, true),
  ];

  if (filters.classSlug) {
    conditions.push(eq(vehicleClasses.slug, filters.classSlug));
  }
  if (typeof filters.minSeats === "number") {
    conditions.push(gte(vehicleModels.seats, filters.minSeats));
  }
  if (filters.transmission) {
    conditions.push(eq(vehicleModels.transmission, filters.transmission));
  }
  if (typeof filters.maxDailyRatePesewas === "number") {
    conditions.push(
      lte(vehicleClasses.defaultDailyRate, filters.maxDailyRatePesewas),
    );
  }

  const rows = await db
    .select({
      model: vehicleModels,
      vehicleClass: vehicleClasses,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .where(and(...conditions))
    .orderBy(
      desc(vehicleModels.featured),
      vehicleModels.make,
      vehicleModels.model,
    );

  const modelIds = rows.map((row) => row.model.id);
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

  return rows.map((row) =>
    toPublicVehicleModel(
      row.model,
      row.vehicleClass,
      imageMap.get(row.model.id) ?? [],
    ),
  );
}

export async function getPublicActiveClasses() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      name: vehicleClasses.name,
      slug: vehicleClasses.slug,
    })
    .from(vehicleClasses)
    .where(eq(vehicleClasses.active, true))
    .orderBy(vehicleClasses.name);
}
