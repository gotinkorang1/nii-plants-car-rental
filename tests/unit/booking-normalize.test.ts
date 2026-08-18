import { describe, expect, it } from "vitest";

import {
  normalizeEmail,
  normalizeLicenceCountry,
  normalizeLicenceNumber,
  normalizePersonName,
  normalizePhone,
} from "@/lib/bookings/normalize-customer";

describe("customer normalisation", () => {
  it("trims and lowercases email", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("normalises phone numbers without using names", () => {
    expect(normalizePhone(" +233 24 123 4567 ")).toBe("+233241234567");
    expect(normalizePhone("0241234567")).toBe("0241234567");
  });

  it("collapses name whitespace", () => {
    expect(normalizePersonName("  Ama   Serwaa ")).toBe("Ama Serwaa");
  });

  it("uppercases licence fields", () => {
    expect(normalizeLicenceCountry("ghana")).toBe("GHANA");
    expect(normalizeLicenceNumber(" ab-12 ")).toBe("AB-12");
    expect(normalizeLicenceNumber("")).toBeNull();
  });
});
