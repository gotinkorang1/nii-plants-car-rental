import { describe, expect, it } from "vitest";

import { canManageRates } from "@/lib/availability/permissions";
import {
  classDailyRatesSchema,
  modelCatalogueRatesSchema,
} from "@/lib/validation/rates";

describe("rate workbook validation", () => {
  it("stores class GHS amounts as integer pesewas", () => {
    const parsed = classDailyRatesSchema.parse({
      defaultDailyRateGhs: "715.00",
      defaultSecurityDepositGhs: "1000",
      usdDailyRateFrom: "65",
      usdDailyRateTo: "80",
    });

    expect(parsed.defaultDailyRate).toBe(71500);
    expect(parsed.defaultSecurityDeposit).toBe(100000);
    expect(parsed.usdDailyRateFrom).toBe(65);
    expect(parsed.usdDailyRateTo).toBe(80);
  });

  it("clears catalogue USD when both fields are blank", () => {
    const parsed = classDailyRatesSchema.parse({
      defaultDailyRateGhs: "10",
      defaultSecurityDepositGhs: "20",
      usdDailyRateFrom: "",
      usdDailyRateTo: "",
    });

    expect(parsed.usdDailyRateFrom).toBeNull();
    expect(parsed.usdDailyRateTo).toBeNull();
  });

  it("rejects a USD to lower than from", () => {
    const parsed = classDailyRatesSchema.safeParse({
      defaultDailyRateGhs: "10",
      defaultSecurityDepositGhs: "20",
      usdDailyRateFrom: "100",
      usdDailyRateTo: "80",
    });

    expect(parsed.success).toBe(false);
  });

  it("lets a model inherit the class USD band", () => {
    const parsed = modelCatalogueRatesSchema.parse({
      usdDailyRateFrom: "",
      usdDailyRateTo: "",
    });

    expect(parsed).toEqual({
      usdDailyRateFrom: null,
      usdDailyRateTo: null,
    });
  });
});

describe("rates permissions", () => {
  it("lets fleet, finance, and administrators manage rates", () => {
    expect(canManageRates("fleet")).toBe(true);
    expect(canManageRates("finance")).toBe(true);
    expect(canManageRates("administrator")).toBe(true);
    expect(canManageRates("reservations")).toBe(false);
    expect(canManageRates("content_editor")).toBe(false);
  });
});
