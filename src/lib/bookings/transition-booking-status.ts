import { and, eq, sql } from "drizzle-orm";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { BookingError } from "@/lib/booking/errors";
import type { AppTransaction } from "@/lib/db";
import {
  bookingStatusHistory,
  bookings,
  vehicleAllocations,
} from "@/lib/db/schema";
import { log } from "@/lib/logger";
import {
  canTransitionBookingStatus,
  type BookingStatus,
} from "@/lib/bookings/status";

export type BookingHistoryActor = "system" | "customer" | "staff" | "payment";

export type TransitionBookingStatusInput = {
  bookingId: string;
  fromStatus: BookingStatus;
  toStatus: BookingStatus;
  actorType: BookingHistoryActor;
  actorId?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown>;
};

export function assertBookingTransition(from: BookingStatus, to: BookingStatus) {
  if (!canTransitionBookingStatus(from, to)) {
    throw new BookingError(
      "INVALID_STATUS_TRANSITION",
      "That booking status change is not allowed.",
    );
  }
}

export async function transitionBookingStatus(
  tx: AppTransaction,
  input: TransitionBookingStatusInput,
) {
  assertBookingTransition(input.fromStatus, input.toStatus);

  const extra: Record<string, Date> = {};
  if (input.toStatus === "cancelled") {
    extra.cancelledAt = new Date();
  }
  if (input.toStatus === "expired") {
    extra.expiredAt = new Date();
  }
  if (input.toStatus === "confirmed") {
    extra.confirmedAt = new Date();
  }
  if (input.toStatus === "ready") {
    extra.readyAt = new Date();
  }
  if (input.toStatus === "checked_out") {
    extra.checkedOutAt = new Date();
  }
  if (input.toStatus === "completed") {
    extra.completedAt = new Date();
  }

  await tx
    .update(bookings)
    .set({
      status: input.toStatus,
      ...extra,
    })
    .where(
      and(eq(bookings.id, input.bookingId), eq(bookings.status, input.fromStatus)),
    );

  await tx.insert(bookingStatusHistory).values({
    bookingId: input.bookingId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    reason: input.reason ?? null,
    metadata: input.metadata ?? null,
  });

  log("info", "booking_status_changed", {
    bookingId: input.bookingId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorType: input.actorType,
  });
}

export async function cancelAllocationHold(
  tx: AppTransaction,
  allocationId: string | null | undefined,
) {
  if (!allocationId) {
    return;
  }

  await tx
    .update(vehicleAllocations)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(vehicleAllocations.id, allocationId),
        sql`${vehicleAllocations.status} in ('hold', 'confirmed', 'ready')`,
      ),
    );
}

export async function auditBookingEvent(input: {
  actorType: "staff" | "system" | "customer";
  actorId?: string | null;
  action: string;
  bookingId: string;
  metadata?: Record<string, unknown>;
}) {
  await writeAuditLog({
    actorType: input.actorType,
    actorId: input.actorId,
    action: input.action,
    entityType: "booking",
    entityId: input.bookingId,
    metadata: input.metadata,
  });
}
