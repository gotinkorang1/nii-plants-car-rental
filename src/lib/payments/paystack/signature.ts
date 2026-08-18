import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { paystackSecretKey } from "@/lib/payments/paystack/config";

export function computePaystackSignature(rawBody: string): string {
  const secret = paystackSecretKey();
  if (!secret) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  }
  return createHmac("sha512", secret).update(rawBody).digest("hex");
}

export function verifyPaystackSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  const expected = computePaystackSignature(rawBody);
  const provided = Buffer.from(signature, "hex");
  const computed = Buffer.from(expected, "hex");
  if (provided.length !== computed.length) {
    return false;
  }
  return timingSafeEqual(provided, computed);
}
