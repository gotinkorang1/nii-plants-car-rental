import { describe, expect, it } from "vitest";

import {
  assertIntegerPesewas,
  calculatePercentage,
  formatGhs,
  formatUsd,
  formatUsdDailyRate,
  ghsInputToPesewas,
  ghsToPesewas,
  pesewasToGhs,
  pesewasToGhsInput,
  usdToPesewas,
} from "@/lib/money";

describe("pesewas money helpers", () => {
  it("rejects floating-point money", () => {
    expect(() => assertIntegerPesewas(12.5)).toThrow(/integer/);
  });

  it("converts integer pesewas to cedis without rounding surprises", () => {
    expect(pesewasToGhs(2500)).toBe(25);
    expect(calculatePercentage(10000, 25)).toBe(2500);
  });

  it("formats GHS from integer pesewas", () => {
    expect(formatGhs(2500)).toMatch(/25\.00/);
  });

  it("round-trips GHS form input through integer pesewas", () => {
    expect(ghsInputToPesewas("25.50")).toBe(2550);
    expect(pesewasToGhsInput(2550)).toBe("25.50");
    expect(ghsInputToPesewas("100")).toBe(10000);
    expect(ghsToPesewas("350.00")).toBe(35000);
    expect(() => ghsInputToPesewas("10.123")).toThrow(/two decimal/);
  });
});

describe("published USD catalogue rates", () => {
  it("converts whole dollars to GHS pesewas at the booking rate", () => {
    expect(usdToPesewas(65)).toBe(71500);
    expect(usdToPesewas(88)).toBe(96800);
    expect(usdToPesewas(120)).toBe(132000);
    expect(() => usdToPesewas(65.5)).toThrow(/whole dollars/);
  });

  it("formats a single rate or a published band", () => {
    expect(formatUsd(65)).toBe("$65");
    expect(formatUsdDailyRate(65, 65)).toBe("$65");
    expect(formatUsdDailyRate(80, 100)).toBe("$80–$100");
  });
});
