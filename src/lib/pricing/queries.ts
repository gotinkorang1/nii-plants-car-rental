import "server-only";

import { eq, sql } from "drizzle-orm";

import {
  assertPromotionApplicable,
  PromotionError,
  type PromotionRecord,
} from "@/lib/pricing/apply-promotion";
import { tryGetDb } from "@/lib/db";
import { extras, promotions } from "@/lib/db/schema";
import type { ExtraCatalogItem } from "@/lib/pricing/calculate-extras";

export async function listActiveExtras(): Promise<ExtraCatalogItem[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const rows = await db
    .select({
      id: extras.id,
      name: extras.name,
      pricingType: extras.pricingType,
      price: extras.price,
      active: extras.active,
      description: extras.description,
    })
    .from(extras)
    .where(eq(extras.active, true))
    .orderBy(extras.name);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    pricingType: row.pricingType,
    price: row.price,
    active: row.active,
    description: row.description,
  }));
}

export async function listExtrasAdmin() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db.select().from(extras).orderBy(extras.name);
}

export async function getExtraAdmin(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db.select().from(extras).where(eq(extras.id, id)).limit(1);
  return row ?? null;
}

export async function listPromotionsAdmin() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db.select().from(promotions).orderBy(promotions.code);
}

export async function getPromotionAdmin(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select()
    .from(promotions)
    .where(eq(promotions.id, id))
    .limit(1);
  return row ?? null;
}

export async function findPromotionByCode(
  code: string,
  at = new Date(),
): Promise<PromotionRecord> {
  const db = tryGetDb();
  if (!db) {
    throw new PromotionError("invalid", "Invalid promo code");
  }

  const normalized = code.trim().toLowerCase();
  if (!normalized) {
    throw new PromotionError("invalid", "Invalid promo code");
  }

  const [row] = await db
    .select()
    .from(promotions)
    .where(eq(sql`lower(btrim(${promotions.code}))`, normalized))
    .limit(1);

  if (!row) {
    throw new PromotionError("invalid", "Invalid promo code");
  }

  const record: PromotionRecord = {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    active: row.active,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    maxUses: row.maxUses,
    usageCount: row.usageCount,
  };

  assertPromotionApplicable(record, at);
  return record;
}
