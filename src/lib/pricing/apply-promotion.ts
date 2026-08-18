import { assertIntegerPesewas, calculatePercentage } from "@/lib/money";
import type { AppliedPromotion, PromotionType } from "@/lib/pricing/types";

export type PromotionRecord = {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
  active: boolean;
  startsAt: Date;
  endsAt: Date;
  maxUses: number | null;
  usageCount: number;
};

export type PromotionFailureReason =
  | "invalid"
  | "expired"
  | "inactive"
  | "unavailable";

export class PromotionError extends Error {
  readonly reason: PromotionFailureReason;

  constructor(reason: PromotionFailureReason, message: string) {
    super(message);
    this.name = "PromotionError";
    this.reason = reason;
  }
}

export function promotionPublicMessage(reason: PromotionFailureReason): string {
  switch (reason) {
    case "expired":
      return "Promotion expired";
    case "inactive":
    case "unavailable":
      return "Promotion no longer available";
    default:
      return "Invalid promo code";
  }
}

export function assertPromotionApplicable(
  promotion: PromotionRecord,
  at: Date = new Date(),
): void {
  if (!promotion.active) {
    throw new PromotionError("inactive", "Promotion no longer available");
  }

  if (at.getTime() < promotion.startsAt.getTime()) {
    throw new PromotionError("unavailable", "Promotion no longer available");
  }

  if (at.getTime() > promotion.endsAt.getTime()) {
    throw new PromotionError("expired", "Promotion expired");
  }

  if (promotion.maxUses !== null && promotion.usageCount >= promotion.maxUses) {
    throw new PromotionError("unavailable", "Promotion no longer available");
  }
}

export function calculatePromotionDiscount(
  eligibleTotal: number,
  promotion: Pick<PromotionRecord, "type" | "value">,
): number {
  const eligible = assertIntegerPesewas(eligibleTotal, "eligible total");

  if (promotion.type === "percentage") {
    return calculatePercentage(eligible, promotion.value);
  }

  if (promotion.type === "fixed") {
    const discount = assertIntegerPesewas(promotion.value, "fixed discount");
    return Math.min(discount, eligible);
  }

  throw new Error("Unknown promotion type.");
}

export function toAppliedPromotion(
  promotion: Pick<PromotionRecord, "id" | "code" | "type" | "value">,
): AppliedPromotion {
  return {
    id: promotion.id,
    code: promotion.code,
    type: promotion.type,
    value: promotion.value,
  };
}
