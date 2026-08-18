import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generatePaymentReference(at = new Date()): string {
  const year = String(at.getUTCFullYear()).slice(-2);
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  const bytes = randomBytes(6);
  let suffix = "";
  for (let index = 0; index < 6; index += 1) {
    suffix += ALPHABET[bytes[index]! % ALPHABET.length];
  }
  return `NP-PAY-${year}${month}-${suffix}`;
}
