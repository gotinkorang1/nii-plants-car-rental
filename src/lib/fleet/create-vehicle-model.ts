"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { tryGetDb } from "@/lib/db";
import { vehicleModels } from "@/lib/db/schema";
import {
  type ActionState,
  formCheckbox,
  formString,
  uniqueMessage,
} from "@/lib/fleet/action-helpers";
import { importProviderImages } from "@/lib/fleet/import-provider-images";
import {
  FLEET_CONTENT_ROLES,
  FLEET_MANAGE_ROLES,
  canManageFleet,
} from "@/lib/fleet/permissions";
import {
  vehicleModelContentSchema,
  vehicleModelSchema,
} from "@/lib/validation/vehicle-model";

function parseModelForm(formData: FormData) {
  return vehicleModelSchema.safeParse({
    vehicleClassId: formString(formData, "vehicleClassId"),
    make: formString(formData, "make"),
    model: formString(formData, "model"),
    slug: formString(formData, "slug"),
    yearFrom: formString(formData, "yearFrom"),
    yearTo: formString(formData, "yearTo"),
    description: formString(formData, "description"),
    seats: formString(formData, "seats"),
    doors: formString(formData, "doors"),
    transmission: formString(formData, "transmission"),
    fuelType: formString(formData, "fuelType"),
    luggage: formString(formData, "luggage"),
    airConditioning: formCheckbox(formData, "airConditioning"),
    featured: formCheckbox(formData, "featured"),
    published: formCheckbox(formData, "published"),
    usdDailyRateFrom: formString(formData, "usdDailyRateFrom"),
    usdDailyRateTo: formString(formData, "usdDailyRateTo"),
    generation: formString(formData, "generation"),
    trimLevel: formString(formData, "trimLevel"),
    bodyType: formString(formData, "bodyType"),
    engineName: formString(formData, "engineName"),
    engineDisplacementL: formString(formData, "engineDisplacementL"),
    cylinders: formString(formData, "cylinders"),
    powerKw: formString(formData, "powerKw"),
    torqueNm: formString(formData, "torqueNm"),
    driveType: formString(formData, "driveType"),
    lengthMm: formString(formData, "lengthMm"),
    widthMm: formString(formData, "widthMm"),
    heightMm: formString(formData, "heightMm"),
    wheelbaseMm: formString(formData, "wheelbaseMm"),
    fuelEconomyLPer100Km: formString(formData, "fuelEconomyLPer100Km"),
    batteryCapacityKwh: formString(formData, "batteryCapacityKwh"),
    usableBatteryKwh: formString(formData, "usableBatteryKwh"),
    evRangeKm: formString(formData, "evRangeKm"),
    acChargingKw: formString(formData, "acChargingKw"),
    dcChargingKw: formString(formData, "dcChargingKw"),
    customFields: formString(formData, "customFields"),
    externalProvider: formString(formData, "externalProvider"),
    externalVehicleId: formString(formData, "externalVehicleId"),
  });
}

function parseImageIds(raw: string): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

type ImportProvenance = {
  externalProvider: string | null;
  externalVehicleId: string | null;
  externalImportedAt: Date | null;
};

/**
 * Stamps when provider data was last pulled in. The timestamp only moves when
 * the model is newly linked to a provider record, so re-saving an imported
 * model does not pretend a fresh import happened.
 */
function withImportTimestamp<T extends { externalProvider: string | null; externalVehicleId: string | null }>(
  values: T,
  existing?: ImportProvenance,
): T & { externalImportedAt: Date | null } {
  if (!values.externalProvider || !values.externalVehicleId) {
    return { ...values, externalImportedAt: null };
  }

  const alreadyLinked =
    existing?.externalProvider === values.externalProvider &&
    existing?.externalVehicleId === values.externalVehicleId;

  return {
    ...values,
    externalImportedAt: alreadyLinked
      ? (existing?.externalImportedAt ?? new Date())
      : new Date(),
  };
}

export async function createVehicleModel(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parseModelForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the model details." };
  }

  let createdId: string | undefined;

  try {
    const [created] = await db
      .insert(vehicleModels)
      .values(withImportTimestamp(parsed.data))
      .returning({ id: vehicleModels.id });

    createdId = created?.id;

    await writeAuditLog({
      actorType: "staff",
      action: "fleet.model.create",
      entityType: "vehicle_model",
      entityId: createdId,
    });
  } catch (error) {
    return { error: uniqueMessage(error, "The vehicle model could not be saved.") };
  }

  // Images are copied after the model exists. A failure here is logged and
  // skipped: the saved model must not be lost because of an image.
  if (createdId && parsed.data.externalVehicleId) {
    await importProviderImages({
      modelId: createdId,
      providerId: parsed.data.externalVehicleId,
      imageIds: parseImageIds(formString(formData, "importImageIds")),
      primaryImageId: formString(formData, "primaryImportImageId") || null,
      altTextBase: `${parsed.data.make} ${parsed.data.model}`,
    });
  }

  redirect("/admin/fleet/models");
}

export async function updateVehicleModel(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(FLEET_CONTENT_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const existing = await db
    .select()
    .from(vehicleModels)
    .where(eq(vehicleModels.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    return { error: "Vehicle model not found." };
  }

  if (canManageFleet(staff.role)) {
    const parsed = parseModelForm(formData);
    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Check the model details.",
      };
    }

    const stamped = withImportTimestamp(parsed.data, existing);
    const values = existing.published
      ? { ...stamped, slug: existing.slug }
      : stamped;

    try {
      await db.update(vehicleModels).set(values).where(eq(vehicleModels.id, id));
    } catch (error) {
      return {
        error: uniqueMessage(error, "The vehicle model could not be updated."),
      };
    }
  } else {
    const parsed = vehicleModelContentSchema.safeParse({
      description: formString(formData, "description"),
      featured: formCheckbox(formData, "featured"),
      published: formCheckbox(formData, "published"),
    });

    if (!parsed.success) {
      return {
        error: parsed.error.issues[0]?.message ?? "Check the model details.",
      };
    }

    await db
      .update(vehicleModels)
      .set(parsed.data)
      .where(eq(vehicleModels.id, id));
  }

  await writeAuditLog({
    actorType: "staff",
    actorId: staff.id,
    action: "fleet.model.update",
    entityType: "vehicle_model",
    entityId: id,
  });

  return { success: "Vehicle model updated." };
}

export async function unpublishVehicleModel(id: string): Promise<void> {
  await requireRoleAction(FLEET_CONTENT_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  await db
    .update(vehicleModels)
    .set({ published: false })
    .where(eq(vehicleModels.id, id));

  await writeAuditLog({
    actorType: "staff",
    action: "fleet.model.unpublish",
    entityType: "vehicle_model",
    entityId: id,
  });

  redirect("/admin/fleet/models");
}

export async function deleteVehicleModel(id: string): Promise<void> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  try {
    await db.delete(vehicleModels).where(eq(vehicleModels.id, id));
  } catch {
    await db
      .update(vehicleModels)
      .set({ published: false })
      .where(eq(vehicleModels.id, id));

    redirect("/admin/fleet/models");
  }

  await writeAuditLog({
    actorType: "staff",
    action: "fleet.model.delete",
    entityType: "vehicle_model",
    entityId: id,
  });

  redirect("/admin/fleet/models");
}
