import "server-only";

import { and, eq } from "drizzle-orm";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import type { AppTransaction } from "@/lib/db";
import { enquiries, enquiryStatusHistory } from "@/lib/db/schema";
import { EnquiryError } from "@/lib/enquiries/errors";
import {
  assertEnquiryTransition,
  type EnquiryStatus,
} from "@/lib/enquiries/status";
import { log } from "@/lib/logger";

export type EnquiryHistoryActor = "system" | "customer" | "staff";

export type TransitionEnquiryStatusInput = {
  enquiryId: string;
  fromStatus: EnquiryStatus;
  toStatus: EnquiryStatus;
  actorType: EnquiryHistoryActor;
  actorId?: string | null;
  reason?: string | null;
};

function statusTimestampField(toStatus: EnquiryStatus): Partial<{
  contactedAt: Date;
  quotedAt: Date;
  acceptedAt: Date;
  closedAt: Date;
}> {
  const now = new Date();
  switch (toStatus) {
    case "contacted":
      return { contactedAt: now };
    case "quoted":
      return { quotedAt: now };
    case "accepted":
      return { acceptedAt: now };
    case "closed":
    case "declined":
      return { closedAt: now };
    default:
      return {};
  }
}

export async function transitionEnquiryStatus(
  tx: AppTransaction,
  input: TransitionEnquiryStatusInput,
) {
  if (input.fromStatus === input.toStatus) {
    return;
  }

  try {
    assertEnquiryTransition(input.fromStatus, input.toStatus);
  } catch {
    throw new EnquiryError(
      "INVALID_STATUS_TRANSITION",
      "That enquiry status change is not allowed.",
    );
  }

  await tx
    .update(enquiries)
    .set({
      status: input.toStatus,
      ...statusTimestampField(input.toStatus),
    })
    .where(and(eq(enquiries.id, input.enquiryId), eq(enquiries.status, input.fromStatus)));

  await tx.insert(enquiryStatusHistory).values({
    enquiryId: input.enquiryId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    reason: input.reason ?? null,
  });

  log("info", "enquiry_status_changed", {
    enquiryId: input.enquiryId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
  });
}

export async function auditEnquiryEvent(input: {
  staffId?: string | null;
  action: string;
  enquiryId: string;
  metadata?: Record<string, unknown>;
}) {
  await writeAuditLog({
    actorType: input.staffId ? "staff" : "system",
    actorId: input.staffId ?? null,
    action: input.action,
    entityType: "enquiry",
    entityId: input.enquiryId,
    metadata: input.metadata,
  });
}

export function lockEnquiryNotFound() {
  throw new EnquiryError("ENQUIRY_NOT_FOUND", "That enquiry was not found.");
}
