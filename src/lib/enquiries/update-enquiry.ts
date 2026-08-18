import "server-only";

import { and, eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { enquiries, staffProfiles } from "@/lib/db/schema";
import { EnquiryError } from "@/lib/enquiries/errors";
import {
  auditEnquiryEvent,
  transitionEnquiryStatus,
} from "@/lib/enquiries/transition-enquiry-status";
import { ghsToPesewas } from "@/lib/money";

export async function assignEnquiry(input: {
  enquiryId: string;
  assignedTo: string | null;
  staffId: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiries are not configured.");
  }

  if (input.assignedTo) {
    const [staff] = await db
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(and(eq(staffProfiles.id, input.assignedTo), eq(staffProfiles.active, true)))
      .limit(1);
    if (!staff) {
      throw new EnquiryError("VALIDATION_FAILED", "Choose an active staff member.");
    }
  }

  const [row] = await db
    .update(enquiries)
    .set({ assignedTo: input.assignedTo })
    .where(eq(enquiries.id, input.enquiryId))
    .returning({ id: enquiries.id });

  if (!row) {
    throw new EnquiryError("ENQUIRY_NOT_FOUND", "That enquiry was not found.");
  }

  await auditEnquiryEvent({
    staffId: input.staffId,
    action: "enquiry_assigned",
    enquiryId: input.enquiryId,
    metadata: { assignedTo: input.assignedTo },
  });
}

export async function updateEnquiryInternalNotes(input: {
  enquiryId: string;
  internalNotes: string;
  staffId: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiries are not configured.");
  }

  const [row] = await db
    .update(enquiries)
    .set({ internalNotes: input.internalNotes })
    .where(eq(enquiries.id, input.enquiryId))
    .returning({ id: enquiries.id });

  if (!row) {
    throw new EnquiryError("ENQUIRY_NOT_FOUND", "That enquiry was not found.");
  }

  await auditEnquiryEvent({
    staffId: input.staffId,
    action: "enquiry_internal_notes_updated",
    enquiryId: input.enquiryId,
  });
}

export async function saveEnquiryQuote(input: {
  enquiryId: string;
  quotedAmountGhs: string;
  quoteNotes?: string;
  quoteValidUntil?: string;
  staffId: string;
  sendEmail?: boolean;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiries are not configured.");
  }

  const quotedAmount = ghsToPesewas(input.quotedAmountGhs, "Quoted amount");
  const quoteValidUntil = input.quoteValidUntil
    ? new Date(input.quoteValidUntil)
    : null;

  let hadQuote = false;

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, input.enquiryId))
      .limit(1);

    if (!current) {
      throw new EnquiryError("ENQUIRY_NOT_FOUND", "That enquiry was not found.");
    }

    hadQuote = current.quotedAmount !== null;

    await tx
      .update(enquiries)
      .set({
        quotedAmount,
        quoteNotes: input.quoteNotes ?? null,
        quoteValidUntil,
      })
      .where(eq(enquiries.id, input.enquiryId));

    if (current.status !== "quoted") {
      await transitionEnquiryStatus(tx, {
        enquiryId: input.enquiryId,
        fromStatus: current.status,
        toStatus: "quoted",
        actorType: "staff",
        actorId: input.staffId,
        reason: "Manual quote recorded.",
      });
    }
  });

  await auditEnquiryEvent({
    staffId: input.staffId,
    action: hadQuote ? "enquiry_quote_updated" : "enquiry_quote_created",
    enquiryId: input.enquiryId,
    metadata: { quotedAmount },
  });

  if (input.sendEmail) {
    const { notifyEnquiryQuote } = await import("@/lib/enquiries/notify");
    await notifyEnquiryQuote(input.enquiryId);
  }
}

export async function changeEnquiryStatus(input: {
  enquiryId: string;
  toStatus: import("@/lib/enquiries/status").EnquiryStatus;
  staffId: string;
  reason?: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiries are not configured.");
  }

  await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, input.enquiryId))
      .limit(1);

    if (!current) {
      throw new EnquiryError("ENQUIRY_NOT_FOUND", "That enquiry was not found.");
    }

    await transitionEnquiryStatus(tx, {
      enquiryId: input.enquiryId,
      fromStatus: current.status,
      toStatus: input.toStatus,
      actorType: "staff",
      actorId: input.staffId,
      reason: input.reason ?? null,
    });
  });

  await auditEnquiryEvent({
    staffId: input.staffId,
    action:
      input.toStatus === "closed" ? "enquiry_closed" : "enquiry_status_changed",
    enquiryId: input.enquiryId,
    metadata: { toStatus: input.toStatus },
  });
}
