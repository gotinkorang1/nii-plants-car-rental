import { readFileSync } from "node:fs";
import path from "node:path";

type OutboxEntry = {
  to?: string;
  template?: string;
  text?: string;
  subject?: string;
  otp?: string;
};

function readOutbox(): OutboxEntry[] {
  const file = path.join(process.cwd(), ".email-outbox.json");
  try {
    return JSON.parse(readFileSync(file, "utf8")) as OutboxEntry[];
  } catch {
    return [];
  }
}

export function getLatestOutboxEmail(input: { to: string; template: string }) {
  const normalized = input.to.trim().toLowerCase();
  const entries = readOutbox();
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (entry?.template !== input.template) {
      continue;
    }
    if (entry.to?.trim().toLowerCase() !== normalized) {
      continue;
    }
    return entry;
  }
  return null;
}

export async function waitForOutboxEmail(
  input: { to: string; template: string },
  options?: { timeoutMs?: number; intervalMs?: number },
) {
  const timeoutMs = options?.timeoutMs ?? 5000;
  const intervalMs = options?.intervalMs ?? 200;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const entry = getLatestOutboxEmail(input);
    if (entry) {
      return entry;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return null;
}

export function latestCapturedOtp(email: string, reference?: string) {
  const parsed = readOutbox();
    const normalized = email.trim().toLowerCase();
    for (let index = parsed.length - 1; index >= 0; index -= 1) {
      const entry = parsed[index];
      if (entry?.template !== "booking-access-code") {
        continue;
      }
      if (entry.to?.trim().toLowerCase() !== normalized) {
        continue;
      }
      if (reference && !entry.text?.includes(reference)) {
        continue;
      }
      if (entry.otp && /^\d{6}$/.test(entry.otp)) {
        return entry.otp;
      }
    }
  return null;
}
