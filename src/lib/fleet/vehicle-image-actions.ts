"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { tryGetDb } from "@/lib/db";
import { vehicleImages } from "@/lib/db/schema";
import {
  type ActionState,
  formCheckbox,
  formString,
} from "@/lib/fleet/action-helpers";
import { FLEET_CONTENT_ROLES } from "@/lib/fleet/permissions";
import { deleteFleetImageObject, uploadFleetImage } from "@/lib/fleet/storage";
import { vehicleImageMetadataSchema } from "@/lib/validation/vehicle-image";

export async function uploadVehicleImage(
  modelId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(FLEET_CONTENT_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  const parsed = vehicleImageMetadataSchema.safeParse({
    altText: formString(formData, "altText"),
    sortOrder: formString(formData, "sortOrder") || "0",
    isPrimary: formCheckbox(formData, "isPrimary"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the image details." };
  }

  try {
    const uploaded = await uploadFleetImage({ modelId, file });
    if (parsed.data.isPrimary) {
      await db
        .update(vehicleImages)
        .set({ isPrimary: false })
        .where(eq(vehicleImages.vehicleModelId, modelId));
    }

    await db.insert(vehicleImages).values({
      vehicleModelId: modelId,
      storagePath: uploaded.storagePath,
      altText: parsed.data.altText,
      sortOrder: parsed.data.sortOrder,
      isPrimary: parsed.data.isPrimary,
    });
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "The image could not be uploaded.",
    };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "fleet.image.upload",
    entityType: "vehicle_model",
    entityId: modelId,
  });
  revalidatePath(`/admin/fleet/models/${modelId}`);
  return { success: "Image uploaded." };
}

export async function updateVehicleImage(
  imageId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(FLEET_CONTENT_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = vehicleImageMetadataSchema.safeParse({
    altText: formString(formData, "altText"),
    sortOrder: formString(formData, "sortOrder") || "0",
    isPrimary: formCheckbox(formData, "isPrimary"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the image details." };
  }

  const [image] = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.id, imageId))
    .limit(1);

  if (!image) {
    return { error: "Image not found." };
  }

  if (parsed.data.isPrimary) {
    await db
      .update(vehicleImages)
      .set({ isPrimary: false })
      .where(eq(vehicleImages.vehicleModelId, image.vehicleModelId));
  }

  await db
    .update(vehicleImages)
    .set(parsed.data)
    .where(eq(vehicleImages.id, imageId));

  revalidatePath(`/admin/fleet/models/${image.vehicleModelId}`);
  return { success: "Image updated." };
}

export async function deleteVehicleImage(imageId: string): Promise<void> {
  await requireRoleAction(FLEET_CONTENT_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const [image] = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.id, imageId))
    .limit(1);

  if (!image) {
    return;
  }

  await db.delete(vehicleImages).where(eq(vehicleImages.id, imageId));
  try {
    await deleteFleetImageObject(image.storagePath);
  } catch {
    // Row is already gone; file cleanup can be retried later.
  }

  await writeAuditLog({
    actorType: "staff",
    action: "fleet.image.delete",
    entityType: "vehicle_model",
    entityId: image.vehicleModelId,
  });
  revalidatePath(`/admin/fleet/models/${image.vehicleModelId}`);
}

export async function markVehicleImagePrimary(imageId: string): Promise<void> {
  await requireRoleAction(FLEET_CONTENT_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const [image] = await db
    .select()
    .from(vehicleImages)
    .where(eq(vehicleImages.id, imageId))
    .limit(1);

  if (!image) {
    return;
  }

  await db
    .update(vehicleImages)
    .set({ isPrimary: false })
    .where(eq(vehicleImages.vehicleModelId, image.vehicleModelId));
  await db
    .update(vehicleImages)
    .set({ isPrimary: true })
    .where(eq(vehicleImages.id, imageId));

  revalidatePath(`/admin/fleet/models/${image.vehicleModelId}`);
}
