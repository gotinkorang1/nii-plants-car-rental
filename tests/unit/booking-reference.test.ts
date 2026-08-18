import { describe, expect, it } from "vitest";

import { generateBookingReference, generateOtpDigits } from "@/lib/bookings/generate-booking-reference";

describe("booking reference", () => {
  it("uses a non-sequential NP-YYMM-XXXX format", () => {
    const at = new Date("2026-08-18T00:00:00Z");
    const first = generateBookingReference(at);
    const second = generateBookingReference(at);
    expect(first).toMatch(/^NP-2608-[A-HJ-NP-Z2-9]{4}$/);
    expect(second).toMatch(/^NP-2608-[A-HJ-NP-Z2-9]{4}$/);
    expect(first).not.toBe(second);
  });
});

describe("OTP digits", () => {
  it("generates a 6-digit numeric code", () => {
    const code = generateOtpDigits(6);
    expect(code).toMatch(/^\d{6}$/);
    expect(code).not.toBe("123456");
  });
});
