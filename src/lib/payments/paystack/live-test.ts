import "server-only";

export const LIVE_PAYMENT_TEST_AMOUNT = 300;

export type LivePaymentTestInput = {
  email: string;
  phone: string;
  reference: string;
  callbackUrl: string;
};

export function buildLivePaymentTestPayload(input: LivePaymentTestInput) {
  return {
    email: input.email,
    amount: LIVE_PAYMENT_TEST_AMOUNT,
    currency: "GHS" as const,
    reference: input.reference,
    callback_url: input.callbackUrl,
    metadata: {
      phone: input.phone,
      purpose: "live_payment_test",
    },
  };
}
