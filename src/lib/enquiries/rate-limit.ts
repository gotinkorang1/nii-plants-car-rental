import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { enquiries } from "@/lib/db/schema";
import { EnquiryError } from "@/lib/enquiries/errors";
import { log } from "@/lib/logger";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_EMAIL = 5;

export async function assertEnquiryRateLimit(email: string) {
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const since = new Date(Date.now() - WINDOW_MS);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enquiries)
    .where(and(eq(enquiries.email, email), gte(enquiries.createdAt, since)));

  if ((count ?? 0) >= MAX_PER_EMAIL) {
    log("info", "enquiry_spam_rejected", { reason: "rate_limit", email });
    throw new EnquiryError(
      "RATE_LIMITED",
      "Too many requests were sent recently. Please try again later or contact us directly.",
    );
  }
}

export function assertHoneypotClear(value: string | undefined) {
  if (value?.trim()) {
    log("info", "enquiry_spam_rejected", { reason: "honeypot" });
    throw new EnquiryError("SPAM_REJECTED", "Request could not be processed.");
  }
}
