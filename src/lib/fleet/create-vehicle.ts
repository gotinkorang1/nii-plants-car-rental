"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { listFutureBlockingAllocations } from "@/lib/availability/manual-block";
import { tryGetDb } from "@/lib/db";
import { vehicleModels, vehicles } from "@/lib/db/schema";
import {
  type ActionState,
  formString,
  uniqueMessage,
} from "@/lib/fleet/action-helpers";
import { FLEET_MANAGE_ROLES } from "@/lib/fleet/permissions";
import { vehicleSchema } from "@/lib/validation/vehicle";

function parseVehicleForm(formData: FormData) {
  return vehicleSchema.safeParse({
    vehicleModelId: formString(formData, "vehicleModelId"),
    vehicleClassId: formString(formData, "vehicleClassId") || undefined,
    internalCode: formString(formData, "internalCode"),
    registrationNumber: formString(formData, "registrationNumber"),
    colour: formString(formData, "colour"),
    currentMileage: formString(formData, "currentMileage"),
    status: formString(formData, "status"),
    branchLocationId: formString(formData, "branchLocationId"),
    notes: formString(formData, "notes"),
  });
}

async function classIdForModel(modelId: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [model] = await db
    .select({ vehicleClassId: vehicleModels.vehicleClassId })
    .from(vehicleModels)
    .where(eq(vehicleModels.id, modelId))
    .limit(1);

  return model?.vehicleClassId ?? null;
}

export async function createPhysicalVehicle(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the vehicle details." };
  }

  const vehicleClassId = await classIdForModel(parsed.data.vehicleModelId);
  if (!vehicleClassId) {
    return { error: "Choose a valid vehicle model." };
  }

  try {
    const [created] = await db
      .insert(vehicles)
      .values({
        ...parsed.data,
        vehicleClassId,
      })
      .returning({ id: vehicles.id });

    await writeAuditLog({
      actorType: "staff",
      action: "fleet.vehicle.create",
      entityType: "vehicle",
      entityId: created?.id,
    });
  } catch (error) {
    return {
      error: uniqueMessage(error, "The physical vehicle could not be saved."),
    };
  }

  redirect("/admin/fleet/vehicles");
}

export async function updatePhysicalVehicle(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = parseVehicleForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the vehicle details." };
  }

  const vehicleClassId = await classIdForModel(parsed.data.vehicleModelId);
  if (!vehicleClassId) {
    return { error: "Choose a valid vehicle model." };
  }

  if (parsed.data.status === "inactive") {
    const [current] = await db
      .select({ status: vehicles.status })
      .from(vehicles)
      .where(eq(vehicles.id, id))
      .limit(1);
    if (current && current.status !== "inactive") {
      const future = await listFutureBlockingAllocations(id);
      if (future.length > 0 && formString(formData, "confirmDeactivate") !== "on") {
        return {
          error:
            "This vehicle has future occupancy. Confirm deactivation to continue. Allocations will not be deleted.",
        };
      }
    }
  }

  try {
    await db
      .update(vehicles)
      .set({
        ...parsed.data,
        vehicleClassId,
      })
      .where(eq(vehicles.id, id));
  } catch (error) {
    return {
      error: uniqueMessage(error, "The physical vehicle could not be updated."),
    };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "fleet.vehicle.update",
    entityType: "vehicle",
    entityId: id,
  });

  return { success: "Physical vehicle updated." };
}

export async function deletePhysicalVehicle(id: string): Promise<void> {
  await requireRoleAction(FLEET_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  await db.delete(vehicles).where(eq(vehicles.id, id));
  await writeAuditLog({
    actorType: "staff",
    action: "fleet.vehicle.delete",
    entityType: "vehicle",
    entityId: id,
  });

  redirect("/admin/fleet/vehicles");
}
