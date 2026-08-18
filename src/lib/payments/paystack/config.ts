import "server-only";

import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { isProductionRuntime } from "@/lib/env/runtime-environment";

export function paystackMockEnabled() {
  if (isProductionRuntime()) {
    return false;
  }
  return process.env.PAYSTACK_MOCK === "1" || process.env.VITEST === "true";
}

export function paystackSecretKey() {
  if (paystackMockEnabled()) {
    return serverEnv.PAYSTACK_SECRET_KEY ?? "sk_test_mock";
  }
  return serverEnv.PAYSTACK_SECRET_KEY;
}

export function paystackConfigured() {
  return paystackMockEnabled() || Boolean(serverEnv.PAYSTACK_SECRET_KEY);
}

export function paystackCallbackUrl() {
  if (serverEnv.PAYSTACK_CALLBACK_URL) {
    return serverEnv.PAYSTACK_CALLBACK_URL;
  }
  const base = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }
  return `${base}/payment/callback`;
}
