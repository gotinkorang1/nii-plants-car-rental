import "server-only";

import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  vehicleClasses,
  vehicleImages,
  vehicleModels,
} from "@/lib/db/schema";
import { toPublicVehicleModel } from "@/lib/fleet/map-public-model";
import type { PublicVehicleModel } from "@/lib/fleet/public-types";

export async function getRelatedModels(
  model: PublicVehicleModel,
  limit = 3,
): Promise<PublicVehicleModel[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const rows = await db
    .select({
      related: vehicleModels,
      vehicleClass: vehicleClasses,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .where(
      and(
        eq(vehicleClasses.slug, model.classSlug),
        eq(vehicleModels.published, true),
        eq(vehicleClasses.active, true),
        ne(vehicleModels.id, model.id),
      ),
    )
    .orderBy(desc(vehicleModels.featured), vehicleModels.make)
    .limit(limit);

  const relatedIds = rows.map((row) => row.related.id);
  const images =
    relatedIds.length === 0
      ? []
      : await db
          .select()
          .from(vehicleImages)
          .where(inArray(vehicleImages.vehicleModelId, relatedIds));

  const imageMap = new Map<string, (typeof vehicleImages.$inferSelect)[]>();
  for (const image of images) {
    const list = imageMap.get(image.vehicleModelId) ?? [];
    list.push(image);
    imageMap.set(image.vehicleModelId, list);
  }

  return rows.map((row) =>
    toPublicVehicleModel(
      row.related,
      row.vehicleClass,
      imageMap.get(row.related.id) ?? [],
    ),
  );
}
