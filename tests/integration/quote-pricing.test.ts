import { randomUUID } from "node:crypto";

import { config } from "dotenv";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { calculateBookingPrice, toPricingSnapshot } from "@/lib/pricing/calculate-booking-price";
import {
  calculateChargeableDays,
} from "@/lib/pricing/calculate-chargeable-days";
import type { ExtraCatalogItem } from "@/lib/pricing/calculate-extras";
import type { PromotionRecord } from "@/lib/pricing/apply-promotion";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Phase 4 quote pricing tests. Configure .env.local, migrate, and seed.",
  );
}

describe("database-backed quote pricing", () => {
  let sql: postgres.Sql;

  beforeAll(() => {
    sql = postgres(databaseUrl, { max: 2 });
  });

  afterAll(async () => {
    await sql.end({ timeout: 1 });
  });

  it("persists a server-calculated quote from seeded catalogue prices", async () => {
    const [vehicleClass] = await sql<{
      id: string;
      default_daily_rate: number;
      default_security_deposit: number;
    }[]>`
      SELECT id, default_daily_rate, default_security_deposit
      FROM vehicle_classes
      WHERE slug = 'compact-sedan' AND active = true
      LIMIT 1
    `;
    const [model] = await sql<{ id: string }[]>`
      SELECT id FROM vehicle_models
      WHERE slug = 'hyundai-accent' AND published = true
      LIMIT 1
    `;
    const [location] = await sql<{ id: string }[]>`
      SELECT id FROM locations WHERE active = true ORDER BY slug LIMIT 1
    `;
    const extras = await sql<{
      id: string;
      name: string;
      price: number;
      pricing_type: "once" | "per_day";
    }[]>`
      SELECT id, name, price, pricing_type
      FROM extras
      WHERE active = true AND name IN ('Child seat', 'Delivery')
    `;
    const [promotion] = await sql<{
      id: string;
      code: string;
      type: "percentage" | "fixed";
      value: number;
      active: boolean;
      starts_at: Date;
      ends_at: Date;
      max_uses: number | null;
      usage_count: number;
    }[]>`
      SELECT id, code, type, value, active, starts_at, ends_at, max_uses, usage_count
      FROM promotions
      WHERE lower(btrim(code)) = 'nii10'
      LIMIT 1
    `;
    const [settings] = await sql<{ value: unknown }[]>`
      SELECT value FROM site_settings WHERE key = 'reservationPaymentPercent'
    `;

    expect(vehicleClass).toBeTruthy();
    expect(model).toBeTruthy();
    expect(location).toBeTruthy();
    expect(promotion).toBeTruthy();
    expect(vehicleClass.default_daily_rate).toBe(71500);
    expect(vehicleClass.default_security_deposit).toBe(100000);

    const pickupAt = new Date("2031-03-10T10:00:00Z");
    const returnAt = new Date("2031-03-12T10:00:00Z");
    expect(calculateChargeableDays(pickupAt, returnAt)).toBe(2);

    const extraCatalog: ExtraCatalogItem[] = extras.map((extra) => ({
      id: extra.id,
      name: extra.name,
      price: extra.price,
      pricingType: extra.pricing_type,
      active: true,
    }));
    const childSeat = extraCatalog.find((extra) => extra.name === "Child seat");
    const delivery = extraCatalog.find((extra) => extra.name === "Delivery");
    expect(childSeat?.price).toBe(5000);
    expect(childSeat?.pricingType).toBe("per_day");
    expect(delivery?.price).toBe(15000);
    expect(delivery?.pricingType).toBe("once");

    const promotionRecord: PromotionRecord = {
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      value: promotion.value,
      active: promotion.active,
      startsAt: new Date(promotion.starts_at),
      endsAt: new Date(promotion.ends_at),
      maxUses: promotion.max_uses,
      usageCount: promotion.usage_count,
    };

    const reservationPercent =
      typeof settings?.value === "number" ? settings.value : 25;

    const price = calculateBookingPrice({
      pickupAt,
      returnAt,
      dailyRate: vehicleClass.default_daily_rate,
      securityDepositRequired: vehicleClass.default_security_deposit,
      reservationPaymentPercent: reservationPercent,
      extraCatalog,
      extraSelections: [
        { extraId: childSeat!.id, quantity: 1 },
        { extraId: delivery!.id, quantity: 1 },
      ],
      promotion: promotionRecord,
    });

    expect(price.chargeableDays).toBe(2);
    expect(price.dailyRate).toBe(71500);
    expect(price.baseRental).toBe(143000);
    expect(price.extrasTotal).toBe(25000);
    expect(price.discountTotal).toBe(16800);
    expect(price.rentalTotal).toBe(151200);
    expect(price.reservationPayment).toBe(37800);
    expect(price.remainingBalance).toBe(113400);
    expect(price.securityDepositRequired).toBe(100000);
    expect(
      price.rentalTotal + price.securityDepositRequired,
    ).toBeGreaterThan(price.rentalTotal);

    const quoteId = randomUUID();
    const snapshot = toPricingSnapshot(price);
    await sql`
      INSERT INTO quotes (
        id, vehicle_model_id, vehicle_class_id, pickup_location_id, return_location_id,
        pickup_at, return_at, chargeable_days, daily_rate, base_rental, extras_total,
        discount_total, rental_total, reservation_payment, remaining_balance,
        security_deposit_required, promotion_id, pricing_snapshot, expires_at
      )
      VALUES (
        ${quoteId}, ${model.id}, ${vehicleClass.id}, ${location.id}, ${location.id},
        ${pickupAt.toISOString()}::timestamptz, ${returnAt.toISOString()}::timestamptz,
        ${price.chargeableDays}, ${price.dailyRate}, ${price.baseRental}, ${price.extrasTotal},
        ${price.discountTotal}, ${price.rentalTotal}, ${price.reservationPayment},
        ${price.remainingBalance}, ${price.securityDepositRequired}, ${promotion.id},
        ${sql.json(snapshot)}::jsonb, now() + interval '15 minutes'
      )
    `;

    await sql`UPDATE vehicle_classes SET default_daily_rate = 1 WHERE id = ${vehicleClass.id}`;
    const [stored] = await sql<{
      daily_rate: number;
      rental_total: number;
      reservation_payment: number;
      remaining_balance: number;
      security_deposit_required: number;
      extras_total: number;
      discount_total: number;
      pricing_snapshot: typeof snapshot;
    }[]>`
      SELECT daily_rate, rental_total, reservation_payment, remaining_balance,
        security_deposit_required, extras_total, discount_total, pricing_snapshot
      FROM quotes WHERE id = ${quoteId}
    `;

    expect(stored?.daily_rate).toBe(71500);
    expect(stored?.rental_total).toBe(151200);
    expect(stored?.reservation_payment).toBe(37800);
    expect(stored?.remaining_balance).toBe(113400);
    expect(stored?.security_deposit_required).toBe(100000);
    expect(stored?.extras_total).toBe(25000);
    expect(stored?.discount_total).toBe(16800);
    expect(stored?.pricing_snapshot.dailyRate).toBe(71500);
    expect(stored?.pricing_snapshot.rentalTotal).toBe(151200);

    await sql`UPDATE vehicle_classes SET default_daily_rate = 71500 WHERE id = ${vehicleClass.id}`;
    await sql`DELETE FROM quotes WHERE id = ${quoteId}`;
  });
});
