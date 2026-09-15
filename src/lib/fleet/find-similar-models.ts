import "server-only";

import { and, eq, ne, or, sql } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { vehicleModels } from "@/lib/db/schema";
import { log } from "@/lib/logger";
import type { VehicleImportDuplicate } from "@/lib/vehicle-data/import-payload";

/**
 * Finds models that look like the one about to be imported.
 *
 * This only warns. Records are never merged automatically, and staff can
 * continue anyway.
 */
export async function findSimilarVehicleModels(input: {
  make: string;
  model: string;
  externalProvider?: string | null;
  externalVehicleId?: string | null;
  excludeId?: string;
}): Promise<VehicleImportDuplicate[]> {
  const db = tryGetDb();
  if (!db || !input.make.trim() || !input.model.trim()) {
    return [];
  }

  const nameMatch = and(
    sql`lower(${vehicleModels.make}) = lower(${input.make})`,
    sql`lower(${vehicleModels.model}) = lower(${input.model})`,
  );

  const providerMatch =
    input.externalProvider && input.externalVehicleId
      ? and(
          eq(vehicleModels.externalProvider, input.externalProvider),
          eq(vehicleModels.externalVehicleId, input.externalVehicleId),
        )
      : undefined;

  const conditions = [
    providerMatch ? or(nameMatch, providerMatch) : nameMatch,
    input.excludeId ? ne(vehicleModels.id, input.excludeId) : undefined,
  ].filter(Boolean);

  try {
    return await db
      .select({
        id: vehicleModels.id,
        slug: vehicleModels.slug,
        make: vehicleModels.make,
        model: vehicleModels.model,
        yearFrom: vehicleModels.yearFrom,
        trimLevel: vehicleModels.trimLevel,
        published: vehicleModels.published,
      })
      .from(vehicleModels)
      .where(and(...conditions))
      .orderBy(vehicleModels.make, vehicleModels.model)
      .limit(5);
  } catch (error) {
    // A duplicate warning is advisory: never block the import because of it.
    log("warn", "vehicle_data_duplicate_check_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}
