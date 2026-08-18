import "server-only";

import { createHmac, randomBytes } from "node:crypto";

import { paystackMockEnabled, paystackSecretKey } from "@/lib/payments/paystack/config";

export async function paystackRequest<T>(input: {
  path: string;
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}): Promise<T> {
  const secret = paystackSecretKey();
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }

  const response = await fetch(`https://api.paystack.co${input.path}`, {
    method: input.method ?? "GET",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: input.body ? JSON.stringify(input.body) : undefined,
  });

  const payload = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: T;
  };

  if (!response.ok || payload.status === false) {
    throw new Error(payload.message ?? "Paystack request failed.");
  }

  return payload.data as T;
}

export function mockAccessCode(reference: string) {
  return `mock_${reference.toLowerCase()}`;
}

export function mockAuthorizationUrl(reference: string) {
  return `/payment/mock/checkout?reference=${encodeURIComponent(reference)}`;
}

export function mockTransactionId(reference: string) {
  return `mock_tx_${reference.replace(/[^A-Za-z0-9]/g, "").slice(0, 24)}`;
}

export function mockWebhookSignature(rawBody: string) {
  if (!paystackMockEnabled()) {
    return "";
  }
  return createHmac("sha512", paystackSecretKey() ?? "sk_test_mock")
    .update(rawBody)
    .digest("hex");
}

export function randomMockSuffix() {
  return randomBytes(4).toString("hex");
}
