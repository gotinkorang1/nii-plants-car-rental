import { z } from "zod";

import { normalizeUsdDailyRange } from "@/lib/money";
import {
  ghsAmountSchema,
  optionalUsdInputSchema,
  refineUsdDailyRange,
} from "@/lib/validation/vehicle-class";

export const classDailyRatesInputSchema = z
  .object({
    defaultDailyRateGhs: ghsAmountSchema,
    defaultSecurityDepositGhs: ghsAmountSchema,
    usdDailyRateFrom: optionalUsdInputSchema,
    usdDailyRateTo: optionalUsdInputSchema,
  })
  .superRefine((value, ctx) => {
    refineUsdDailyRange(value.usdDailyRateFrom, value.usdDailyRateTo, ctx);
  });

export const classDailyRatesSchema = classDailyRatesInputSchema.transform(
  (value) => ({
    defaultDailyRate: value.defaultDailyRateGhs,
    defaultSecurityDeposit: value.defaultSecurityDepositGhs,
    ...normalizeUsdDailyRange(value.usdDailyRateFrom, value.usdDailyRateTo),
  }),
);

export const modelCatalogueRatesInputSchema = z
  .object({
    usdDailyRateFrom: optionalUsdInputSchema,
    usdDailyRateTo: optionalUsdInputSchema,
  })
  .superRefine((value, ctx) => {
    refineUsdDailyRange(value.usdDailyRateFrom, value.usdDailyRateTo, ctx);
  });

export const modelCatalogueRatesSchema = modelCatalogueRatesInputSchema.transform(
  (value) => normalizeUsdDailyRange(value.usdDailyRateFrom, value.usdDailyRateTo),
);

export type ClassDailyRatesValues = z.output<typeof classDailyRatesSchema>;
export type ModelCatalogueRatesValues = z.output<typeof modelCatalogueRatesSchema>;
