import "server-only";

import { eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { vehicleImages } from "@/lib/db/schema";
import { log } from "@/lib/logger";
import { uploadFleetImageBytes } from "@/lib/fleet/storage";
import { parseProviderId } from "@/lib/vehicle-data/cardatabase";
import {
  getVehicleDataProvider,
  isVehicleImageImportEnabled,
} from "@/lib/vehicle-data/provider";
import { detectImageMimeType } from "@/lib/validation/vehicle-image";

const MAX_IMPORTED_IMAGES = 6;

export type ImportProviderImagesResult = {
  imported: number;
  skipped: number;
};

/**
 * Copies provider images into Nii Plants storage.
 *
 * Only ids the provider itself listed for `providerId` are accepted; the URL is
 * rebuilt server-side rather than taken from the browser. Failures are logged
 * and skipped so a bad image never loses the saved model.
 */
export async function importProviderImages(input: {
  modelId: string;
  providerId: string;
  imageIds: string[];
  primaryImageId: string | null;
  altTextBase: string;
}): Promise<ImportProviderImagesResult> {
  const empty = { imported: 0, skipped: 0 };

  if (input.imageIds.length === 0) {
    return empty;
  }

  if (!isVehicleImageImportEnabled()) {
    log("warn", "vehicle_data_image_import_disabled", {
      model_id: input.modelId,
      requested: input.imageIds.length,
    });
    return { imported: 0, skipped: input.imageIds.length };
  }

  const provider = getVehicleDataProvider();
  const db = tryGetDb();
  if (!provider || !db || !parseProviderId(input.providerId)) {
    return { imported: 0, skipped: input.imageIds.length };
  }

  const requested = [...new Set(input.imageIds)].slice(0, MAX_IMPORTED_IMAGES);

  let existingCount: number;
  try {
    const existing = await db
      .select({ id: vehicleImages.id })
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleModelId, input.modelId));
    existingCount = existing.length;
  } catch (error) {
    log("warn", "vehicle_data_failure", {
      stage: "image_import_precheck",
      model_id: input.modelId,
      error: error instanceof Error ? error.message : "unknown",
    });
    return { imported: 0, skipped: requested.length };
  }

  let imported = 0;
  let skipped = 0;

  for (const [index, providerImageId] of requested.entries()) {
    try {
      const file = await provider.downloadImage(input.providerId, providerImageId);
      const mimeType = detectImageMimeType(file.bytes);
      if (!mimeType) {
        skipped += 1;
        continue;
      }

      const stored = await uploadFleetImageBytes({
        modelId: input.modelId,
        bytes: file.bytes,
        size: file.bytes.byteLength,
      });

      const isPrimary =
        existingCount === 0 &&
        (input.primaryImageId
          ? providerImageId === input.primaryImageId
          : index === 0);

      if (isPrimary) {
        await db
          .update(vehicleImages)
          .set({ isPrimary: false })
          .where(eq(vehicleImages.vehicleModelId, input.modelId));
      }

      await db.insert(vehicleImages).values({
        vehicleModelId: input.modelId,
        storagePath: stored.storagePath,
        altText: `${input.altTextBase} catalogue image`.slice(0, 160),
        sortOrder: existingCount + index,
        isPrimary,
        sourceProvider: provider.name,
        sourceUrl: file.sourceUrl,
      });

      imported += 1;
    } catch (error) {
      skipped += 1;
      log("warn", "vehicle_data_failure", {
        stage: "image_import",
        model_id: input.modelId,
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  log("info", "vehicle_data_image_import", {
    model_id: input.modelId,
    imported,
    skipped,
  });

  return { imported, skipped };
}
