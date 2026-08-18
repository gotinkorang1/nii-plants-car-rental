import { describe, expect, it } from "vitest";

import { hashOtp, hashesMatch, hashSessionToken } from "@/lib/bookings/secrets";

describe("OTP hashing", () => {
  it("hashes with booking context rather than the code alone", () => {
    const first = hashOtp({
      bookingId: "11111111-1111-1111-1111-111111111111",
      emailNormalized: "ada@example.com",
      code: "482731",
    });
    const second = hashOtp({
      bookingId: "22222222-2222-2222-2222-222222222222",
      emailNormalized: "ada@example.com",
      code: "482731",
    });
    expect(first).toHaveLength(64);
    expect(first).not.toBe(second);
    expect(hashesMatch(first, first)).toBe(true);
    expect(hashesMatch(first, second)).toBe(false);
  });
});

describe("guest session hashing", () => {
  it("does not store the raw token", () => {
    const token = "a".repeat(43);
    expect(hashSessionToken(token)).not.toBe(token);
  });
});
