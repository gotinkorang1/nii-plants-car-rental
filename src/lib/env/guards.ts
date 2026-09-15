import "server-only";

import { asOptionalString } from "@/lib/env";
import { publicEnv } from "@/lib/env";
import type { ServerEnv } from "@/lib/env.server";

import { getRuntimeEnvironment, isProductionRuntime } from "./runtime-environment";

export function isPaystackTestSecret(secret: string): boolean {
  return secret.startsWith("sk_test_");
}

export function isPaystackLiveSecret(secret: string): boolean {
  return secret.startsWith("sk_live_");
}

function isLocalhostUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  } catch {
    return false;
  }
}

export function assertProductionEnvironmentSafety(env: ServerEnv): void {
  if (!isProductionRuntime()) {
    return;
  }

  const errors: string[] = [];

  if (process.env.PAYSTACK_MOCK === "1") {
    errors.push("PAYSTACK_MOCK must not be enabled in production.");
  }

  if (process.env.EMAIL_DEV_OUTBOX === "1") {
    errors.push("EMAIL_DEV_OUTBOX must not be enabled in production.");
  }

  if (process.env.CARDATABASE_MOCK === "1") {
    errors.push("CARDATABASE_MOCK must not be enabled in production.");
  }

  if (!asOptionalString(process.env.BOOKING_OTP_SECRET)) {
    errors.push("BOOKING_OTP_SECRET is required in production.");
  }

  const appUrl = publicEnv.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    errors.push("NEXT_PUBLIC_APP_URL is required in production.");
  } else if (isLocalhostUrl(appUrl)) {
    errors.push("NEXT_PUBLIC_APP_URL must not point to localhost in production.");
  }

  const required: (keyof ServerEnv)[] = [
    "DATABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PAYSTACK_SECRET_KEY",
    "RESEND_API_KEY",
    "EMAIL_FROM",
  ];

  for (const key of required) {
    if (!env[key]) {
      errors.push(`${key} is required in production.`);
    }
  }

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required in production.");
  }

  if (!publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required in production.");
  }

  const paystackSecret = env.PAYSTACK_SECRET_KEY;
  if (paystackSecret) {
    if (isPaystackTestSecret(paystackSecret)) {
      errors.push(
        "Paystack TEST secret keys must not be used when APP_ENV/VERCEL_ENV is production.",
      );
    }
    if (!isPaystackLiveSecret(paystackSecret)) {
      errors.push("PAYSTACK_SECRET_KEY must be a Paystack live secret in production.");
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Production environment validation failed (${getRuntimeEnvironment()}): ${errors.join(" ")}`,
    );
  }
}

export function assertPreviewEnvironmentSafety(env: ServerEnv): void {
  if (getRuntimeEnvironment() !== "preview") {
    return;
  }

  if (process.env.EMAIL_DEV_OUTBOX !== "1" && !env.RESEND_API_KEY) {
    // Preview may use outbox; real Resend is optional but must not silently impersonate production.
    return;
  }

  const paystackSecret = env.PAYSTACK_SECRET_KEY;
  if (paystackSecret && isPaystackLiveSecret(paystackSecret)) {
    throw new Error(
      "Paystack LIVE secret keys must not be used on preview/staging deployments.",
    );
  }
}

export function extractSupabaseProjectRef(databaseUrl: string): string | null {
  try {
    const host = new URL(databaseUrl).hostname.toLowerCase();
    const match = host.match(/^db\.([a-z0-9-]+)\.supabase\.co$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export function isBlockedProductionDatabaseTarget(databaseUrl: string): boolean {
  const blockedRef = asOptionalString(process.env.PRODUCTION_SUPABASE_PROJECT_REF);
  if (!blockedRef) {
    return false;
  }
  const ref = extractSupabaseProjectRef(databaseUrl);
  return ref === blockedRef.trim().toLowerCase();
}
