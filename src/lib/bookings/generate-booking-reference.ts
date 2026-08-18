import { randomBytes, randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateBookingReference(at = new Date()): string {
  const year = String(at.getUTCFullYear()).slice(-2);
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  const bytes = randomBytes(4);
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += ALPHABET[bytes[index]! % ALPHABET.length];
  }
  return `NP-${year}${month}-${suffix}`;
}

export function generateOtpDigits(length = 6): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, "0");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
