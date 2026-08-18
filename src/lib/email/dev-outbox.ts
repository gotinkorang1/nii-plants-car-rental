import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type EmailOutboxEntry = {
  id: string;
  to: string;
  subject: string;
  template: string;
  text: string;
  createdAt: string;
  otp?: string;
};

/**
 * Path to the capture file.
 *
 * `EMAIL_OUTBOX_WORKER` gives each parallel test worker its own file inside a
 * fixed directory; without it, concurrent read-modify-write cycles drop
 * entries. The directory is a literal so build-time tracing stays scoped.
 */
export const EMAIL_OUTBOX_PATH = process.env.EMAIL_OUTBOX_WORKER
  ? path.join(
      process.cwd(),
      ".email-outbox",
      `${process.env.EMAIL_OUTBOX_WORKER}.json`,
    )
  : path.join(process.cwd(), ".email-outbox.json");

export async function appendDevOutbox(entry: EmailOutboxEntry) {
  await mkdir(path.dirname(EMAIL_OUTBOX_PATH), { recursive: true });
  const existing = await readDevOutbox();
  existing.push(entry);
  await writeFile(EMAIL_OUTBOX_PATH, `${JSON.stringify(existing, null, 2)}\n`);
}

export async function readDevOutbox(): Promise<EmailOutboxEntry[]> {
  try {
    const raw = await readFile(EMAIL_OUTBOX_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as EmailOutboxEntry[]) : [];
  } catch {
    return [];
  }
}

export async function latestDevOtp(input: {
  email: string;
  reference?: string;
}): Promise<string | null> {
  const entries = await readDevOutbox();
  const email = input.email.trim().toLowerCase();
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (!entry || entry.template !== "booking-access-code") {
      continue;
    }
    if (entry.to.trim().toLowerCase() !== email) {
      continue;
    }
    if (input.reference && !entry.text.includes(input.reference)) {
      continue;
    }
    if (entry.otp && /^\d{6}$/.test(entry.otp)) {
      return entry.otp;
    }
  }
  return null;
}
