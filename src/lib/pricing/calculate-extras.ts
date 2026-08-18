import { assertIntegerPesewas } from "@/lib/money";
import { calculateChargeableDays } from "@/lib/pricing/calculate-chargeable-days";
import type { ExtraPricingType, PricedExtra } from "@/lib/pricing/types";

export const MAX_EXTRA_QUANTITY = 10;

export type ExtraCatalogItem = {
  id: string;
  name: string;
  pricingType: ExtraPricingType;
  price: number;
  active: boolean;
  description?: string;
};

export function extraLineTotal(input: {
  pricingType: ExtraPricingType;
  unitPrice: number;
  quantity: number;
  chargeableDays: number;
}): number {
  const unitPrice = assertIntegerPesewas(input.unitPrice, "extra unit price");
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("Extra quantity must be an integer of at least 1.");
  }
  if (input.quantity > MAX_EXTRA_QUANTITY) {
    throw new Error(`Extra quantity cannot exceed ${MAX_EXTRA_QUANTITY}.`);
  }

  if (input.pricingType === "once") {
    return unitPrice * input.quantity;
  }

  if (input.pricingType === "per_day") {
    if (!Number.isInteger(input.chargeableDays) || input.chargeableDays < 1) {
      throw new Error("Chargeable days must be a positive integer.");
    }
    return unitPrice * input.quantity * input.chargeableDays;
  }

  throw new Error("Unknown extra pricing type.");
}

export function calculateExtrasTotal(
  extras: Array<Pick<PricedExtra, "total">>,
): number {
  return extras.reduce((sum, extra) => {
    return sum + assertIntegerPesewas(extra.total, "extra total");
  }, 0);
}

export function priceSelectedExtras(input: {
  pickupAt: Date;
  returnAt: Date;
  extras: ExtraCatalogItem[];
  selections: Array<{ extraId: string; quantity: number }>;
}): PricedExtra[] {
  const chargeableDays = calculateChargeableDays(input.pickupAt, input.returnAt);
  const catalog = new Map(input.extras.map((extra) => [extra.id, extra]));
  const seen = new Set<string>();
  const priced: PricedExtra[] = [];

  for (const selection of input.selections) {
    if (seen.has(selection.extraId)) {
      throw new Error("Each extra may only be selected once.");
    }
    seen.add(selection.extraId);

    const extra = catalog.get(selection.extraId);
    if (!extra || !extra.active) {
      throw new Error("Choose only active extras.");
    }

    const unitPrice = assertIntegerPesewas(extra.price, "extra price");
    priced.push({
      id: extra.id,
      name: extra.name,
      pricingType: extra.pricingType,
      quantity: selection.quantity,
      unitPrice,
      total: extraLineTotal({
        pricingType: extra.pricingType,
        unitPrice,
        quantity: selection.quantity,
        chargeableDays,
      }),
    });
  }

  return priced;
}
