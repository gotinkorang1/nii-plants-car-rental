import "server-only";

import { eq, sql } from "drizzle-orm";

import { createVehicleHold } from "@/lib/availability/create-hold";
import { expireVehicleHolds } from "@/lib/availability/expire-holds";
import {
  getAvailableModels,
  resolveSearchLocations,
} from "@/lib/availability/get-available-models";
import { BookingError } from "@/lib/booking/errors";
import {
  assertMinimumDuration,
  assertPickupNotInPast,
  type QuoteRequestValues,
} from "@/lib/validation/availability";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { tryGetDb } from "@/lib/db";
import { quotes, vehicleAllocations, vehicleClasses, vehicleModels } from "@/lib/db/schema";
import { log } from "@/lib/logger";
import { PromotionError } from "@/lib/pricing/apply-promotion";
import {
  calculateBookingPrice,
  toPricingSnapshot,
} from "@/lib/pricing/calculate-booking-price";
import { findPromotionByCode, listActiveExtras } from "@/lib/pricing/queries";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { assertSelfDriveBookingEnabled } from "@/lib/settings/operational-guards";

export async function createQuoteAndHold(input: {
  search: QuoteRequestValues;
  createdBy?: string | null;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new BookingError(
      "VEHICLE_UNAVAILABLE",
      "Availability is not configured yet.",
    );
  }

  const settings = await getSiteSettings();
  assertSelfDriveBookingEnabled(settings);
  assertPickupNotInPast(input.search.pickupAt);
  assertMinimumDuration(
    input.search.pickupAt,
    input.search.returnAt,
    settings.minimumRentalHours,
  );

  const locations = await resolveSearchLocations({
    pickupLocation: input.search.pickupLocation,
    returnLocation: input.search.returnLocation,
  });

  const [model] = await db
    .select({
      model: vehicleModels,
      vehicleClass: vehicleClasses,
    })
    .from(vehicleModels)
    .innerJoin(
      vehicleClasses,
      eq(vehicleModels.vehicleClassId, vehicleClasses.id),
    )
    .where(eq(vehicleModels.slug, input.search.modelSlug))
    .limit(1);

  if (!model || !model.model.published) {
    throw new BookingError("UNPUBLISHED_MODEL", "Choose a published vehicle.");
  }

  if (!model.vehicleClass.active) {
    throw new BookingError(
      "INACTIVE_VEHICLE_CLASS",
      "That vehicle class is not available for booking.",
    );
  }

  const available = await getAvailableModels(input.search);
  if (!available.some((item) => item.slug === model.model.slug)) {
    throw new BookingError(
      "VEHICLE_UNAVAILABLE",
      "That vehicle was just reserved for these dates. Please choose another available option.",
    );
  }

  const extraCatalog = await listActiveExtras();
  const selectedIds = new Set(input.search.extras.map((item) => item.extraId));
  for (const extraId of selectedIds) {
    if (!extraCatalog.some((extra) => extra.id === extraId)) {
      throw new BookingError("INACTIVE_EXTRA", "Choose only active extras.");
    }
  }

  let promotion = null;
  if (input.search.promoCode) {
    try {
      promotion = await findPromotionByCode(input.search.promoCode);
    } catch (error) {
      if (error instanceof PromotionError) {
        const code =
          error.reason === "expired"
            ? "PROMO_EXPIRED"
            : error.reason === "invalid"
              ? "INVALID_PROMO"
              : "PROMO_UNAVAILABLE";
        throw new BookingError(code, error.message);
      }
      throw error;
    }
  }

  const price = calculateBookingPrice({
    pickupAt: input.search.pickupAt,
    returnAt: input.search.returnAt,
    dailyRate: model.vehicleClass.defaultDailyRate,
    securityDepositRequired: model.vehicleClass.defaultSecurityDeposit,
    reservationPaymentPercent: settings.reservationPaymentPercent,
    extraCatalog,
    extraSelections: input.search.extras,
    promotion,
  });

  const snapshot = toPricingSnapshot(price);
  const expiresAt = new Date(
    Date.now() + settings.quoteDurationMinutes * 60 * 1000,
  );

  await expireVehicleHolds();

  const created = await db.transaction(async (tx) => {
    const [quote] = await tx
      .insert(quotes)
      .values({
        vehicleModelId: model.model.id,
        vehicleClassId: model.vehicleClass.id,
        pickupLocationId: locations.pickup.id,
        returnLocationId: locations.dropoff.id,
        pickupAt: input.search.pickupAt,
        returnAt: input.search.returnAt,
        chargeableDays: price.chargeableDays,
        dailyRate: price.dailyRate,
        baseRental: price.baseRental,
        extrasTotal: price.extrasTotal,
        discountTotal: price.discountTotal,
        rentalTotal: price.rentalTotal,
        reservationPayment: price.reservationPayment,
        remainingBalance: price.remainingBalance,
        securityDepositRequired: price.securityDepositRequired,
        promotionId: promotion?.id ?? null,
        pricingSnapshot: snapshot,
        expiresAt,
      })
      .returning();

    if (!quote) {
      throw new BookingError(
        "VEHICLE_UNAVAILABLE",
        "That vehicle was just reserved for these dates. Please choose another available option.",
      );
    }

    const hold = await createVehicleHold(tx, {
      vehicleClassId: model.vehicleClass.id,
      vehicleModelId: model.model.id,
      pickupAt: input.search.pickupAt,
      returnAt: input.search.returnAt,
      quoteId: quote.id,
      holdMinutes: settings.holdDurationMinutes,
      createdBy: input.createdBy ?? null,
    });

    return { quote, hold };
  });

  log("info", "quote_created", {
    quoteId: created.quote.id,
    modelSlug: model.model.slug,
    rentalTotal: created.quote.rentalTotal,
  });

  await writeAuditLog({
    actorType: input.createdBy ? "staff" : "system",
    actorId: input.createdBy,
    action: "quote.create",
    entityType: "quote",
    entityId: created.quote.id,
  });

  return created;
}

export async function getQuoteById(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      quote: quotes,
      model: vehicleModels,
      vehicleClass: vehicleClasses,
      quoteExpired: sql<boolean>`${quotes.expiresAt} <= now()`,
      holdActive: sql<boolean>`exists (
        select 1
        from ${vehicleAllocations}
        where ${vehicleAllocations.quoteId} = ${quotes.id}
          and ${vehicleAllocations.status} = 'hold'
          and ${vehicleAllocations.expiresAt} is not null
          and ${vehicleAllocations.expiresAt} > now()
      )`,
    })
    .from(quotes)
    .innerJoin(vehicleModels, eq(quotes.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(quotes.vehicleClassId, vehicleClasses.id))
    .where(eq(quotes.id, id))
    .limit(1);

  return row ?? null;
}
