import { describe, expect, it } from "vitest";

import { buildLivePaymentTestPayload } from "@/lib/payments/paystack/live-test";

describe("live Paystack payment test payload", () => {
  it("creates a GH₵3 payload with customer contact metadata", () => {
    expect(
      buildLivePaymentTestPayload({
        email: "gotinkorang@gmail.com",
        phone: "0554664733",
        reference: "NP-TEST-2031-ABC123",
        callbackUrl: "https://www.niiplantsghana.com/admin/payments/test/callback",
      }),
    ).toEqual({
      email: "gotinkorang@gmail.com",
      amount: 300,
      currency: "GHS",
      reference: "NP-TEST-2031-ABC123",
      callback_url:
        "https://www.niiplantsghana.com/admin/payments/test/callback",
      metadata: {
        phone: "0554664733",
        purpose: "live_payment_test",
      },
    });
  });
});
