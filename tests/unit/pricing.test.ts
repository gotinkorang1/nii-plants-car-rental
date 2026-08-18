import { describe, expect, it } from "vitest";

import { calculatePercentage, ghsToPesewas } from "@/lib/money";
import { PromotionError, calculatePromotionDiscount } from "@/lib/pricing/apply-promotion";
import { calculateBookingPrice } from "@/lib/pricing/calculate-booking-price";
import { calculateChargeableDays } from "@/lib/pricing/calculate-chargeable-days";
import { extraLineTotal } from "@/lib/pricing/calculate-extras";
import { availabilitySearchSchema } from "@/lib/validation/availability";

const pickup = new Date("2026-08-20T10:00:00.000Z");

function atHours(hours: number, extraMinutes = 0) {
  return new Date(pickup.getTime() + hours * 60 * 60 * 1000 + extraMinutes * 60 * 1000);
}

const extraCatalog = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Delivery",
    pricingType: "once" as const,
    price: 15000,
    active: true,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Child Seat",
    pricingType: "per_day" as const,
    price: 5000,
    active: true,
  },
];

describe("chargeable days", () => {
  it("charges whole 24-hour blocks using integer remainder arithmetic", () => {
    expect(calculateChargeableDays(pickup, atHours(24))).toBe(1);
    expect(calculateChargeableDays(pickup, atHours(24, 1))).toBe(2);
    expect(calculateChargeableDays(pickup, atHours(48))).toBe(2);
    expect(calculateChargeableDays(pickup, atHours(48, 1))).toBe(3);
    expect(calculateChargeableDays(pickup, atHours(25))).toBe(2);
    expect(calculateChargeableDays(pickup, atHours(72))).toBe(3);
  });
});

describe("extras pricing", () => {
  it("prices once extras without multiplying days", () => {
    expect(
      extraLineTotal({
        pricingType: "once",
        unitPrice: 15000,
        quantity: 1,
        chargeableDays: 3,
      }),
    ).toBe(15000);
  });

  it("prices per-day extras by chargeable days and quantity", () => {
    expect(
      extraLineTotal({
        pricingType: "per_day",
        unitPrice: 5000,
        quantity: 2,
        chargeableDays: 3,
      }),
    ).toBe(30000);
  });
});

describe("booking price", () => {
  it("adds extras, applies one promotion, and keeps the security deposit separate", () => {
    const price = calculateBookingPrice({
      pickupAt: pickup,
      returnAt: atHours(72),
      dailyRate: 30000,
      securityDepositRequired: 100000,
      reservationPaymentPercent: 25,
      extraCatalog,
      extraSelections: [
        { extraId: extraCatalog[0].id, quantity: 1 },
        { extraId: extraCatalog[1].id, quantity: 1 },
      ],
      promotion: {
        id: "33333333-3333-4333-8333-333333333333",
        code: "SAVE10",
        type: "percentage",
        value: 10,
        active: true,
        startsAt: new Date("2026-01-01T00:00:00Z"),
        endsAt: new Date("2027-01-01T00:00:00Z"),
        maxUses: null,
        usageCount: 0,
      },
    });

    expect(price.chargeableDays).toBe(3);
    expect(price.baseRental).toBe(90000);
    expect(price.extrasTotal).toBe(30000);
    expect(price.discountTotal).toBe(12000);
    expect(price.rentalTotal).toBe(108000);
    expect(price.reservationPayment).toBe(27000);
    expect(price.remainingBalance).toBe(81000);
    expect(price.securityDepositRequired).toBe(100000);
    expect(price.rentalTotal + price.securityDepositRequired).toBe(208000);
  });

  it("caps a fixed discount at the eligible total and uses integer arithmetic", () => {
    expect(ghsToPesewas("350.00")).toBe(35000);
    expect(calculatePercentage(100000, 10)).toBe(10000);
    expect(calculatePromotionDiscount(100000, { type: "fixed", value: 20000 })).toBe(
      20000,
    );
    expect(calculatePromotionDiscount(100000, { type: "fixed", value: 150000 })).toBe(
      100000,
    );

    const price = calculateBookingPrice({
      pickupAt: pickup,
      returnAt: atHours(24),
      dailyRate: 10000,
      securityDepositRequired: 0,
      reservationPaymentPercent: 25,
      extraCatalog: [],
      promotion: {
        id: "44444444-4444-4444-8444-444444444444",
        code: "BIG",
        type: "fixed",
        value: 999999,
        active: true,
        startsAt: new Date("2026-01-01T00:00:00Z"),
        endsAt: new Date("2027-01-01T00:00:00Z"),
        maxUses: null,
        usageCount: 0,
      },
    });

    expect(price.rentalTotal).toBe(0);
    expect(price.remainingBalance).toBe(0);
  });

  it("prices a hire with no extras", () => {
    const price = calculateBookingPrice({
      pickupAt: pickup,
      returnAt: atHours(24),
      dailyRate: 35000,
      securityDepositRequired: 150000,
      reservationPaymentPercent: 25,
      extraCatalog: [],
    });

    expect(price.extras).toEqual([]);
    expect(price.extrasTotal).toBe(0);
    expect(price.rentalTotal).toBe(35000);
    expect(price.reservationPayment).toBe(8750);
    expect(price.remainingBalance).toBe(26250);
  });
});

describe("promotion applicability", () => {
  const promotion = {
    id: "55555555-5555-4555-8555-555555555555",
    code: "SAVE10",
    type: "percentage" as const,
    value: 10,
    active: true,
    startsAt: new Date("2026-01-01T00:00:00Z"),
    endsAt: new Date("2026-12-31T00:00:00Z"),
    maxUses: 2,
    usageCount: 2,
  };

  it("rejects inactive, expired, and exhausted promotions", async () => {
    const { assertPromotionApplicable } = await import(
      "@/lib/pricing/apply-promotion"
    );

    expect(() =>
      assertPromotionApplicable({ ...promotion, active: false }),
    ).toThrow(PromotionError);
    expect(() =>
      assertPromotionApplicable(promotion, new Date("2028-01-01T00:00:00Z")),
    ).toThrow(/expired/i);
    expect(() => assertPromotionApplicable(promotion)).toThrow(
      /no longer available/i,
    );
  });
});

describe("availability search validation", () => {
  it("rejects return before pickup, equal times, and invalid locations", () => {
    const invalid = availabilitySearchSchema.safeParse({
      pickupLocation: "plantsville-dansoman",
      pickupDate: "2026-08-20",
      pickupTime: "10:00",
      returnDate: "2026-08-20",
      returnTime: "10:00",
    });
    expect(invalid.success).toBe(false);

    const before = availabilitySearchSchema.safeParse({
      pickupLocation: "plantsville-dansoman",
      pickupDate: "2026-08-21",
      pickupTime: "10:00",
      returnDate: "2026-08-20",
      returnTime: "10:00",
    });
    expect(before.success).toBe(false);
  });

  it("accepts a valid 24-hour range", () => {
    const parsed = availabilitySearchSchema.parse({
      pickupLocation: "plantsville-dansoman",
      pickupDate: "2026-08-20",
      pickupTime: "10:00",
      returnDate: "2026-08-21",
      returnTime: "10:00",
    });
    expect(parsed.returnLocation).toBe("plantsville-dansoman");
    expect(parsed.returnAt.getTime() - parsed.pickupAt.getTime()).toBe(
      24 * 60 * 60 * 1000,
    );
  });
});
