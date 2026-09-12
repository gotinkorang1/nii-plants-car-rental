"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { RATES_MANAGE_ROLES } from "@/lib/availability/permissions";
import { tryGetDb } from "@/lib/db";
import { vehicleClasses, vehicleModels } from "@/lib/db/schema";
import {
  type ActionState,
  formString,
} from "@/lib/fleet/action-helpers";
import {
  classDailyRatesSchema,
  modelCatalogueRatesSchema,
} from "@/lib/validation/rates";

function revalidateRatePages(input?: { classId?: string; modelId?: string; modelSlug?: string }) {
  revalidatePath("/admin/rates");
  revalidatePath("/admin/fleet/classes");
  revalidatePath("/admin/fleet/models");
  revalidatePath("/fleet");
  if (input?.classId) {
    revalidatePath(`/admin/fleet/classes/${input.classId}`);
  }
  if (input?.modelId) {
    revalidatePath(`/admin/fleet/models/${input.modelId}`);
  }
  if (input?.modelSlug) {
    revalidatePath(`/fleet/${input.modelSlug}`);
  }
}

export async function updateClassDailyRatesAction(
  classId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(RATES_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = classDailyRatesSchema.safeParse({
    defaultDailyRateGhs: formString(formData, "defaultDailyRateGhs"),
    defaultSecurityDepositGhs: formString(formData, "defaultSecurityDepositGhs"),
    usdDailyRateFrom: formString(formData, "usdDailyRateFrom"),
    usdDailyRateTo: formString(formData, "usdDailyRateTo"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the class rates." };
  }

  const [existing] = await db
    .select({ id: vehicleClasses.id })
    .from(vehicleClasses)
    .where(eq(vehicleClasses.id, classId))
    .limit(1);

  if (!existing) {
    return { error: "That vehicle class was not found." };
  }

  await db
    .update(vehicleClasses)
    .set(parsed.data)
    .where(eq(vehicleClasses.id, classId));

  await writeAuditLog({
    actorType: "staff",
    actorId: staff.id,
    action: "pricing.class.rates.update",
    entityType: "vehicle_class",
    entityId: classId,
    metadata: {
      defaultDailyRate: parsed.data.defaultDailyRate,
      defaultSecurityDeposit: parsed.data.defaultSecurityDeposit,
      usdDailyRateFrom: parsed.data.usdDailyRateFrom,
      usdDailyRateTo: parsed.data.usdDailyRateTo,
    },
  });

  revalidateRatePages({ classId });
  return { success: "Class rates saved." };
}

export async function updateModelCatalogueRatesAction(
  modelId: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(RATES_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = modelCatalogueRatesSchema.safeParse({
    usdDailyRateFrom: formString(formData, "usdDailyRateFrom"),
    usdDailyRateTo: formString(formData, "usdDailyRateTo"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the catalogue USD rates.",
    };
  }

  const [existing] = await db
    .select({
      id: vehicleModels.id,
      slug: vehicleModels.slug,
    })
    .from(vehicleModels)
    .where(eq(vehicleModels.id, modelId))
    .limit(1);

  if (!existing) {
    return { error: "That vehicle model was not found." };
  }

  await db
    .update(vehicleModels)
    .set(parsed.data)
    .where(eq(vehicleModels.id, modelId));

  await writeAuditLog({
    actorType: "staff",
    actorId: staff.id,
    action: "pricing.model.rates.update",
    entityType: "vehicle_model",
    entityId: modelId,
    metadata: parsed.data,
  });

  revalidateRatePages({ modelId, modelSlug: existing.slug });
  return { success: "Catalogue USD saved." };
}
