import "server-only";

import { eq } from "drizzle-orm";

import { BookingError } from "@/lib/booking/errors";
import { tryGetDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { expireUnpaidBookings } from "@/lib/bookings/expire-unpaid-bookings";
import { notifyBookingCancelled } from "@/lib/bookings/notify";
import { revokeBookingGuestSessions } from "@/lib/bookings/guest-session";
import {
  auditBookingEvent,
  cancelAllocationHold,
  transitionBookingStatus,
} from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";
import type { BookingStatus } from "@/lib/bookings/status";

const CANCELLABLE: BookingStatus[] = [
  "draft",
  "held",
  "payment_pending",
  "under_review",
];

export async function cancelUnpaidBooking(input: {
  bookingId: string;
  reason: string;
  staffId: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  await expireUnpaidBookings();

  const cancelled = await db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .for("update");

    if (!booking) {
      throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
    }

    if (!CANCELLABLE.includes(booking.status)) {
      throw new BookingError(
        "INVALID_STATUS_TRANSITION",
        "That booking cannot be cancelled in its current status.",
      );
    }

    await transitionBookingStatus(tx, {
      bookingId: booking.id,
      fromStatus: booking.status,
      toStatus: "cancelled",
      actorType: "staff",
      actorId: input.staffId,
      reason: input.reason,
    });
    await cancelAllocationHold(tx, booking.vehicleAllocationId);

    const [updated] = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking.id))
      .limit(1);
    return updated ?? booking;
  });

  await revokeBookingGuestSessions(cancelled.id);
  await auditBookingEvent({
    actorType: "staff",
    actorId: input.staffId,
    action: "booking_cancelled",
    bookingId: cancelled.id,
    metadata: { reason: input.reason },
  });
  log("info", "booking_cancelled", { bookingId: cancelled.id });
  try {
    await notifyBookingCancelled(cancelled.id);
  } catch {
    log("warn", "booking_cancelled_email_failed", { bookingId: cancelled.id });
  }
  return cancelled;
}
