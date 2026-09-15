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
import { log } from "@/lib/logger";

export async function getPublicModels(
  filters: PublicFleetFilters = {},
  options: { featuredOnly?: boolean; limit?: number } = {},
): Promise<PublicVehicleModel[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    const conditions = [
      eq(vehicleModels.published, true),
      eq(vehicleClasses.active, true),
    ];

    if (options.featuredOnly) {
      conditions.push(eq(vehicleModels.featured, true));
    }

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

    let rowsQuery = db
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
      )
      .$dynamic();

    if (typeof options.limit === "number" && options.limit > 0) {
      rowsQuery = rowsQuery.limit(Math.min(Math.trunc(options.limit), 50));
    }

    const rows = await rowsQuery;

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
  } catch (error) {
    log("error", "Failed to load public fleet models.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

export async function getPublicActiveClasses() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        name: vehicleClasses.name,
        slug: vehicleClasses.slug,
      })
      .from(vehicleClasses)
      .where(eq(vehicleClasses.active, true))
      .orderBy(vehicleClasses.name);
  } catch (error) {
    log("error", "Failed to load public vehicle classes.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}
