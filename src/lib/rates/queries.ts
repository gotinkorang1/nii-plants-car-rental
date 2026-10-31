import "server-only";

import { eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { extras, promotions, vehicleClasses, vehicleModels } from "@/lib/db/schema";

export async function listClassRates() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: vehicleClasses.id,
      name: vehicleClasses.name,
      slug: vehicleClasses.slug,
      active: vehicleClasses.active,
      defaultDailyRate: vehicleClasses.defaultDailyRate,
      defaultSecurityDeposit: vehicleClasses.defaultSecurityDeposit,
      usdDailyRateFrom: vehicleClasses.usdDailyRateFrom,
      usdDailyRateTo: vehicleClasses.usdDailyRateTo,
    })
    .from(vehicleClasses)
    .orderBy(vehicleClasses.name);
}

export async function listModelCatalogueRates() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: vehicleModels.id,
      make: vehicleModels.make,
      model: vehicleModels.model,
      slug: vehicleModels.slug,
      published: vehicleModels.published,
      usdDailyRateFrom: vehicleModels.usdDailyRateFrom,
      usdDailyRateTo: vehicleModels.usdDailyRateTo,
      classId: vehicleClasses.id,
      className: vehicleClasses.name,
      classDailyRate: vehicleClasses.defaultDailyRate,
      classUsdDailyRateFrom: vehicleClasses.usdDailyRateFrom,
      classUsdDailyRateTo: vehicleClasses.usdDailyRateTo,
    })
    .from(vehicleModels)
    .innerJoin(vehicleClasses, eq(vehicleModels.vehicleClassId, vehicleClasses.id))
    .orderBy(vehicleClasses.name, vehicleModels.make, vehicleModels.model);
}

export async function countRateRelatedCatalog() {
  const db = tryGetDb();
  if (!db) {
    return { extras: 0, promotions: 0 };
  }

  // Avoid pipelining concurrent reads on constrained/direct Supabase sessions.
  const extraRows = await db
    .select({ id: extras.id })
    .from(extras)
    .where(eq(extras.active, true));
  const promoRows = await db
    .select({ id: promotions.id })
    .from(promotions)
    .where(eq(promotions.active, true));

  return {
    extras: extraRows.length,
    promotions: promoRows.length,
  };
}
