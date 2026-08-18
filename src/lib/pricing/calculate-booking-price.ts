import { assertIntegerPesewas, calculatePercentage } from "@/lib/money";
import {
  calculatePromotionDiscount,
  toAppliedPromotion,
  type PromotionRecord,
} from "@/lib/pricing/apply-promotion";
import { calculateChargeableDays } from "@/lib/pricing/calculate-chargeable-days";
import {
  calculateExtrasTotal,
  type ExtraCatalogItem,
  priceSelectedExtras,
} from "@/lib/pricing/calculate-extras";
import {
  PRICING_SNAPSHOT_VERSION,
  type BookingPrice,
  type ExtraSelectionInput,
  type PricingSnapshot,
} from "@/lib/pricing/types";

export type CalculateBookingPriceInput = {
  pickupAt: Date;
  returnAt: Date;
  dailyRate: number;
  securityDepositRequired: number;
  reservationPaymentPercent: number;
  extraCatalog: ExtraCatalogItem[];
  extraSelections?: ExtraSelectionInput[];
  promotion?: PromotionRecord | null;
};

export function calculateBookingPrice(
  input: CalculateBookingPriceInput,
): BookingPrice {
  const dailyRate = assertIntegerPesewas(input.dailyRate, "daily rate");
  const securityDepositRequired = assertIntegerPesewas(
    input.securityDepositRequired,
    "security deposit",
  );
  const chargeableDays = calculateChargeableDays(input.pickupAt, input.returnAt);
  const baseRental = dailyRate * chargeableDays;
  const extras = priceSelectedExtras({
    pickupAt: input.pickupAt,
    returnAt: input.returnAt,
    extras: input.extraCatalog,
    selections: input.extraSelections ?? [],
  });
  const extrasTotal = calculateExtrasTotal(extras);
  const eligibleTotal = baseRental + extrasTotal;
  const discountTotal = input.promotion
    ? calculatePromotionDiscount(eligibleTotal, input.promotion)
    : 0;
  const rentalTotal = eligibleTotal - discountTotal;
  const reservationPayment = calculatePercentage(
    rentalTotal,
    input.reservationPaymentPercent,
  );
  const remainingBalance = rentalTotal - reservationPayment;

  return {
    chargeableDays,
    dailyRate,
    baseRental,
    extras,
    extrasTotal,
    promotion: input.promotion ? toAppliedPromotion(input.promotion) : null,
    discountTotal,
    rentalTotal,
    reservationPayment,
    remainingBalance,
    securityDepositRequired,
  };
}

export function toPricingSnapshot(price: BookingPrice): PricingSnapshot {
  return {
    version: PRICING_SNAPSHOT_VERSION,
    ...price,
  };
}
