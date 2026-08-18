import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateEnquiryReference(at = new Date()): string {
  const year = String(at.getUTCFullYear()).slice(-2);
  const month = String(at.getUTCMonth() + 1).padStart(2, "0");
  const bytes = randomBytes(4);
  let suffix = "";
  for (let index = 0; index < 4; index += 1) {
    suffix += ALPHABET[bytes[index]! % ALPHABET.length];
  }
  return `NP-ENQ-${year}${month}-${suffix}`;
}
