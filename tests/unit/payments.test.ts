import { describe, expect, it } from "vitest";

import {
  determineInitialPaymentPurpose,
  initialPaymentAmount,
} from "@/lib/payments/determine-initial-purpose";
import {
  computeRemainingBalance,
  sumSuccessfulRentalPayments,
} from "@/lib/payments/financial-summary";
import { generatePaymentReference } from "@/lib/payments/generate-payment-reference";
import {
  computePaystackSignature,
  verifyPaystackSignature,
} from "@/lib/payments/paystack/signature";

describe("payment utilities", () => {
  it("generates unique payment references", () => {
    const first = generatePaymentReference();
    const second = generatePaymentReference();
    expect(first).toMatch(/^NP-PAY-\d{4}-[A-Z0-9]{6}$/);
    expect(second).toMatch(/^NP-PAY-\d{4}-[A-Z0-9]{6}$/);
    expect(first).not.toBe(second);
  });

  it("chooses reservation or full rental based on balance due hours", () => {
    const pickup = new Date("2031-08-20T10:00:00Z");
    const now = new Date("2031-08-18T10:00:00Z");
    expect(
      determineInitialPaymentPurpose({ pickupAt: pickup, now, balanceDueHours: 24 }),
    ).toBe("reservation");
    expect(
      determineInitialPaymentPurpose({
        pickupAt: new Date("2031-08-18T20:00:00Z"),
        now,
        balanceDueHours: 24,
      }),
    ).toBe("full_rental");
    expect(
      initialPaymentAmount({
        purpose: "reservation",
        rentalTotal: 100_000,
        reservationPaymentRequired: 25_000,
      }),
    ).toBe(25_000);
    expect(
      initialPaymentAmount({
        purpose: "full_rental",
        rentalTotal: 100_000,
        reservationPaymentRequired: 25_000,
      }),
    ).toBe(100_000);
  });

  it("computes remaining balance without going negative", () => {
    expect(computeRemainingBalance(100_000, 25_000)).toBe(75_000);
    expect(computeRemainingBalance(100_000, 120_000)).toBe(0);
    expect(
      sumSuccessfulRentalPayments([
        { purpose: "reservation", amount: 25_000 },
        { purpose: "balance", amount: 75_000 },
      ]),
    ).toBe(100_000);
  });

  it("verifies Paystack webhook signatures with constant-time comparison", () => {
    process.env.PAYSTACK_MOCK = "1";
    const body = JSON.stringify({ event: "charge.success", data: { reference: "ABC" } });
    const signature = computePaystackSignature(body);
    expect(verifyPaystackSignature(body, signature)).toBe(true);
    expect(verifyPaystackSignature(body, "deadbeef")).toBe(false);
    expect(verifyPaystackSignature(`${body} `, signature)).toBe(false);
  });
});
