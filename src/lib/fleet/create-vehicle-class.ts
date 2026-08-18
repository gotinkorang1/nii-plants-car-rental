"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { tryGetDb } from "@/lib/db";
import { vehicleClasses } from "@/lib/db/schema";
import {
  type ActionState,
  formCheckbox,
  formString,
  uniqueMessage,
} from "@/lib/fleet/action-helpers";
import { FLEET_MANAGE_ROLES } from "@/lib/fleet/permissions";
import { vehicleClassSchema } from "@/lib/validation/vehicle-class";

function parseClassForm(formData: FormData) {
  return vehicleClassSchema.safeParse({
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    description: formString(formData, "description"),
    seats: formString(formData, "seats"),
    luggage: formString(formData, "luggage"),
    transmission: formString(formData, "transmission"),
    defaultDailyRateGhs: formString(formData, "defaultDailyRateGhs"),
    defaultSecurityDepositGhs: formString(formData, "defaultSecurityDepositGhs"),
    usdDailyRateFrom: formString(formData, "usdDailyRateFrom"),
    usdDailyRateTo: formString(formData, "usdDailyRateTo"),
    active: formCheckbox(formData, "active"),
  });
}

export async function createVehicleClass(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parseClassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the class details." };
  }

  try {
    const [created] = await db
      .insert(vehicleClasses)
      .values(parsed.data)
      .returning({ id: vehicleClasses.id });

    await writeAuditLog({
      actorType: "staff",
      action: "fleet.class.create",
      entityType: "vehicle_class",
      entityId: created?.id,
    });
  } catch (error) {
    return { error: uniqueMessage(error, "The vehicle class could not be saved.") };
  }

  redirect("/admin/fleet/classes");
}

export async function updateVehicleClass(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parseClassForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the class details." };
  }

  try {
    await db
      .update(vehicleClasses)
      .set(parsed.data)
      .where(eq(vehicleClasses.id, id));

    await writeAuditLog({
      actorType: "staff",
      action: "fleet.class.update",
      entityType: "vehicle_class",
      entityId: id,
    });
  } catch (error) {
    return { error: uniqueMessage(error, "The vehicle class could not be updated.") };
  }

  return { success: "Vehicle class updated." };
}

export async function deactivateVehicleClass(id: string): Promise<void> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  await db
    .update(vehicleClasses)
    .set({ active: false })
    .where(eq(vehicleClasses.id, id));

  await writeAuditLog({
    actorType: "staff",
    action: "fleet.class.deactivate",
    entityType: "vehicle_class",
    entityId: id,
  });

  redirect("/admin/fleet/classes");
}

export async function deleteVehicleClass(id: string): Promise<void> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  try {
    await db.delete(vehicleClasses).where(eq(vehicleClasses.id, id));
  } catch {
    await db
      .update(vehicleClasses)
      .set({ active: false })
      .where(eq(vehicleClasses.id, id));

    await writeAuditLog({
      actorType: "staff",
      action: "fleet.class.deactivate",
      entityType: "vehicle_class",
      entityId: id,
    });

    redirect("/admin/fleet/classes");
  }

  await writeAuditLog({
    actorType: "staff",
    action: "fleet.class.delete",
    entityType: "vehicle_class",
    entityId: id,
  });

  redirect("/admin/fleet/classes");
}
