import { createHmac, timingSafeEqual } from "node:crypto";

import { asOptionalString } from "@/lib/env";
import { isProductionRuntime } from "@/lib/env/runtime-environment";

function bookingOtpSecret(): string {
  const configured = asOptionalString(process.env.BOOKING_OTP_SECRET);
  if (configured) {
    return configured;
  }

  if (isProductionRuntime()) {
    throw new Error("BOOKING_OTP_SECRET is not configured.");
  }

  return "dev-only-booking-otp-secret";
}

export function hashBookingSecret(purpose: "otp" | "session", value: string): string {
  return createHmac("sha256", bookingOtpSecret())
    .update(`${purpose}:${value}`)
    .digest("hex");
}

export function hashOtp(input: {
  bookingId: string;
  emailNormalized: string;
  code: string;
}): string {
  return hashBookingSecret(
    "otp",
    `${input.bookingId}:${input.emailNormalized}:${input.code}`,
  );
}

export function hashSessionToken(token: string): string {
  return hashBookingSecret("session", token);
}

export function hashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
