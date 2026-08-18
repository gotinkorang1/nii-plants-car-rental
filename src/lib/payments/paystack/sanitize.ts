import type { PaystackVerification, SanitizedPaystackSnapshot } from "@/lib/payments/types";

export function sanitizePaystackSnapshot(
  verification: PaystackVerification,
): SanitizedPaystackSnapshot {
  return {
    status: verification.rawStatus,
    reference: verification.reference,
    amount: verification.amount,
    currency: verification.currency,
    channel: verification.channel,
    paidAt: verification.paidAt?.toISOString() ?? null,
    transactionId: verification.transactionId,
    gatewayResponse: verification.gatewayResponse,
    fees: verification.fees,
  };
}
