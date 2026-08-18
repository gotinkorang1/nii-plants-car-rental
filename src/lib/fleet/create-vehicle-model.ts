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
  });
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

  try {
    const [created] = await db
      .insert(vehicleModels)
      .values(parsed.data)
      .returning({ id: vehicleModels.id });

    await writeAuditLog({
      actorType: "staff",
      action: "fleet.model.create",
      entityType: "vehicle_model",
      entityId: created?.id,
    });
  } catch (error) {
    return { error: uniqueMessage(error, "The vehicle model could not be saved.") };
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

    const values = existing.published
      ? { ...parsed.data, slug: existing.slug }
      : parsed.data;

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
