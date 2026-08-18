export const PRICING_SNAPSHOT_VERSION = 1;

export type ExtraPricingType = "once" | "per_day";
export type PromotionType = "percentage" | "fixed";

export type ExtraSelectionInput = {
  extraId: string;
  quantity: number;
};

export type PricedExtra = {
  id: string;
  name: string;
  pricingType: ExtraPricingType;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type AppliedPromotion = {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
};

export type BookingPrice = {
  chargeableDays: number;
  dailyRate: number;
  baseRental: number;
  extras: PricedExtra[];
  extrasTotal: number;
  promotion: AppliedPromotion | null;
  discountTotal: number;
  rentalTotal: number;
  reservationPayment: number;
  remainingBalance: number;
  securityDepositRequired: number;
};

export type PricingSnapshot = BookingPrice & {
  version: typeof PRICING_SNAPSHOT_VERSION;
};
