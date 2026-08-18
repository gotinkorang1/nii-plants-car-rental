"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import {
  canManageAvailability,
  AVAILABILITY_MANAGE_ROLES,
  RATES_MANAGE_ROLES,
} from "@/lib/availability/permissions";
import {
  cancelManualBlock,
  createManualBlock,
} from "@/lib/availability/manual-block";
import { BookingError } from "@/lib/booking/errors";
import { accraDateTimeToUtc } from "@/lib/booking/timezone";
import { tryGetDb } from "@/lib/db";
import { extras, promotions } from "@/lib/db/schema";
import {
  type ActionState,
  formCheckbox,
  formString,
  uniqueMessage,
} from "@/lib/fleet/action-helpers";
import { ghsInputToPesewas } from "@/lib/money";
import {
  extraInputSchema,
  manualBlockInputSchema,
  promotionInputSchema,
} from "@/lib/validation/availability";

export async function createExtraAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(RATES_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = extraInputSchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    priceGhs: formString(formData, "priceGhs"),
    pricingType: formString(formData, "pricingType"),
    active: formCheckbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the extra." };
  }

  let price: number;
  try {
    price = ghsInputToPesewas(parsed.data.priceGhs, "price");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Enter a valid GHS amount.",
    };
  }

  try {
    await db.insert(extras).values({
      name: parsed.data.name,
      description: parsed.data.description,
      price,
      pricingType: parsed.data.pricingType,
      active: parsed.data.active,
    });
  } catch (error) {
    return { error: uniqueMessage(error, "The extra could not be saved.") };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "pricing.extra.create",
    entityType: "extra",
  });
  redirect("/admin/rates/extras");
}

export async function updateExtraAction(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(RATES_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = extraInputSchema.safeParse({
    name: formString(formData, "name"),
    description: formString(formData, "description"),
    priceGhs: formString(formData, "priceGhs"),
    pricingType: formString(formData, "pricingType"),
    active: formCheckbox(formData, "active"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the extra." };
  }

  let price: number;
  try {
    price = ghsInputToPesewas(parsed.data.priceGhs, "price");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Enter a valid GHS amount.",
    };
  }

  try {
    await db
      .update(extras)
      .set({
        name: parsed.data.name,
        description: parsed.data.description,
        price,
        pricingType: parsed.data.pricingType,
        active: parsed.data.active,
      })
      .where(eq(extras.id, id));
  } catch (error) {
    return { error: uniqueMessage(error, "The extra could not be updated.") };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "pricing.extra.update",
    entityType: "extra",
    entityId: id,
  });
  revalidatePath("/admin/rates/extras");
  return { success: "Extra updated." };
}

export async function createPromotionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(RATES_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = promotionInputSchema.safeParse({
    code: formString(formData, "code"),
    type: formString(formData, "type"),
    value: formString(formData, "value"),
    active: formCheckbox(formData, "active"),
    startsAt: formString(formData, "startsAt"),
    endsAt: formString(formData, "endsAt"),
    maxUses: formString(formData, "maxUses"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the promotion." };
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Enter valid start and end times." };
  }
  if (endsAt < startsAt) {
    return { error: "Promotion end must be on or after the start." };
  }

  let value = parsed.data.value;
  if (parsed.data.type === "fixed") {
    try {
      value = ghsInputToPesewas(formString(formData, "valueGhs") || String(value));
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Enter a valid GHS amount.",
      };
    }
  }

  const maxUsesRaw = parsed.data.maxUses?.trim() ?? "";
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;
  if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) {
    return { error: "Max uses must be a positive whole number." };
  }

  try {
    await db.insert(promotions).values({
      code: parsed.data.code.trim().toUpperCase(),
      type: parsed.data.type,
      value,
      active: parsed.data.active,
      startsAt,
      endsAt,
      maxUses,
    });
  } catch (error) {
    return { error: uniqueMessage(error, "The promotion could not be saved.") };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "pricing.promotion.create",
    entityType: "promotion",
  });
  redirect("/admin/rates/promotions");
}

export async function updatePromotionAction(
  id: string,
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireRoleAction(RATES_MANAGE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = promotionInputSchema.safeParse({
    code: formString(formData, "code"),
    type: formString(formData, "type"),
    value: formString(formData, "value"),
    active: formCheckbox(formData, "active"),
    startsAt: formString(formData, "startsAt"),
    endsAt: formString(formData, "endsAt"),
    maxUses: formString(formData, "maxUses"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the promotion." };
  }

  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return { error: "Enter valid start and end times." };
  }

  let value = parsed.data.value;
  if (parsed.data.type === "fixed") {
    try {
      value = ghsInputToPesewas(formString(formData, "valueGhs") || String(value));
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Enter a valid GHS amount.",
      };
    }
  }

  const maxUsesRaw = parsed.data.maxUses?.trim() ?? "";
  const maxUses = maxUsesRaw ? Number(maxUsesRaw) : null;

  try {
    await db
      .update(promotions)
      .set({
        code: parsed.data.code.trim().toUpperCase(),
        type: parsed.data.type,
        value,
        active: parsed.data.active,
        startsAt,
        endsAt,
        maxUses,
      })
      .where(eq(promotions.id, id));
  } catch (error) {
    return { error: uniqueMessage(error, "The promotion could not be updated.") };
  }

  await writeAuditLog({
    actorType: "staff",
    action: "pricing.promotion.update",
    entityType: "promotion",
    entityId: id,
  });
  revalidatePath("/admin/rates/promotions");
  return { success: "Promotion updated." };
}

export async function createManualBlockAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(AVAILABILITY_MANAGE_ROLES);
  if (!canManageAvailability(staff.role)) {
    return { error: "You cannot block vehicles." };
  }

  const parsed = manualBlockInputSchema.safeParse({
    vehicleId: formString(formData, "vehicleId"),
    reason: formString(formData, "reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the block details." };
  }

  const startDate = formString(formData, "startDate");
  const startTime = formString(formData, "startTime");
  const endDate = formString(formData, "endDate");
  const endTime = formString(formData, "endTime");

  let startAt: Date;
  let endAt: Date;
  try {
    startAt = accraDateTimeToUtc(startDate, startTime);
    endAt = accraDateTimeToUtc(endDate, endTime);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Enter valid dates.",
    };
  }

  try {
    await createManualBlock({
      vehicleId: parsed.data.vehicleId,
      startAt,
      endAt,
      reason: parsed.data.reason,
      createdBy: staff.id,
      allocationType:
        formString(formData, "allocationType") === "maintenance"
          ? "maintenance"
          : "manual_block",
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return { error: error.message };
    }
    return { error: "The vehicle could not be blocked for those times." };
  }

  revalidatePath("/admin/availability");
  return { success: "Vehicle blocked for the selected times." };
}

export async function cancelManualBlockAction(
  allocationId: string,
): Promise<void> {
  const staff = await requireRoleAction(AVAILABILITY_MANAGE_ROLES);
  await cancelManualBlock({ allocationId, actorId: staff.id });
  revalidatePath("/admin/availability");
}
