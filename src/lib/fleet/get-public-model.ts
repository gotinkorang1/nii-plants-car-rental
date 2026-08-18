import "server-only";

import { and, eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  vehicleClasses,
  vehicleImages,
  vehicleModels,
} from "@/lib/db/schema";
import { toPublicVehicleModel } from "@/lib/fleet/map-public-model";
import type { PublicVehicleModel } from "@/lib/fleet/public-types";

export async function getPublicModel(
  slug: string,
): Promise<PublicVehicleModel | null> {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      model: vehicleModels,
      vehicleClass: vehicleClasses,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .where(
      and(
        eq(vehicleModels.slug, slug),
        eq(vehicleModels.published, true),
        eq(vehicleClasses.active, true),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const images = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.vehicleModelId, row.model.id));

  return toPublicVehicleModel(row.model, row.vehicleClass, images);
}
