import "server-only";

import {
  mockAccessCode,
  mockAuthorizationUrl,
  mockTransactionId,
  paystackRequest,
} from "@/lib/payments/paystack/client";
import { paystackMockEnabled } from "@/lib/payments/paystack/config";
import { setMockPaystackTransaction } from "@/lib/payments/paystack/mock-store";
import { PAYSTACK_CURRENCY } from "@/lib/payments/constants";

export type InitializePaystackInput = {
  email: string;
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

export type InitializePaystackResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export async function initializePaystackTransaction(
  input: InitializePaystackInput,
): Promise<InitializePaystackResult> {
  if (paystackMockEnabled()) {
    setMockPaystackTransaction({
      reference: input.reference,
      amount: input.amount,
      currency: PAYSTACK_CURRENCY,
      email: input.email,
      status: "pending",
      transactionId: mockTransactionId(input.reference),
      channel: "mock",
      paidAt: null,
      metadata: input.metadata,
    });
    return {
      authorizationUrl: mockAuthorizationUrl(input.reference),
      accessCode: mockAccessCode(input.reference),
      reference: input.reference,
    };
  }

  const data = await paystackRequest<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>({
    path: "/transaction/initialize",
    method: "POST",
    body: {
      email: input.email,
      amount: input.amount,
      currency: PAYSTACK_CURRENCY,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    },
  });

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  };
}
