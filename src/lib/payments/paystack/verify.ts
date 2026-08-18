import "server-only";

import { getMockPaystackTransaction } from "@/lib/payments/paystack/mock-store";
import { paystackMockEnabled } from "@/lib/payments/paystack/config";
import { paystackRequest } from "@/lib/payments/paystack/client";
import type { PaystackVerification } from "@/lib/payments/types";

function parseVerification(data: {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  id?: number | string;
  paid_at?: string | null;
  channel?: string | null;
  gateway_response?: string | null;
  fees?: number | null;
}): PaystackVerification {
  return {
    status: data.status === "success" ? "success" : data.status,
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
    transactionId: data.id == null ? null : String(data.id),
    paidAt: data.paid_at ? new Date(data.paid_at) : null,
    channel: data.channel ?? null,
    gatewayResponse: data.gateway_response ?? null,
    fees: data.fees ?? null,
    rawStatus: data.status,
  };
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerification> {
  if (paystackMockEnabled()) {
    const mock = getMockPaystackTransaction(reference);
    if (!mock) {
      throw new Error("Mock Paystack transaction was not found.");
    }
    return parseVerification({
      status: mock.status === "success" ? "success" : mock.status,
      reference: mock.reference,
      amount: mock.amount,
      currency: mock.currency,
      id: mock.transactionId,
      paid_at: mock.paidAt,
      channel: mock.channel,
      gateway_response: mock.status,
      fees: 0,
    });
  }

  const data = await paystackRequest<{
    status: string;
    reference: string;
    amount: number;
    currency: string;
    id?: number | string;
    paid_at?: string | null;
    channel?: string | null;
    gateway_response?: string | null;
    fees?: number | null;
  }>({
    path: `/transaction/verify/${encodeURIComponent(reference)}`,
    method: "GET",
  });

  return parseVerification(data);
}

export function buildMockWebhookPayload(reference: string) {
  const mock = getMockPaystackTransaction(reference);
  if (!mock) {
    return null;
  }
  return {
    event: "charge.success",
    data: {
      id: mock.transactionId,
      status: mock.status,
      reference: mock.reference,
      amount: mock.amount,
      currency: mock.currency,
      paid_at: mock.paidAt,
      channel: mock.channel,
      metadata: mock.metadata ?? {},
    },
  };
}
