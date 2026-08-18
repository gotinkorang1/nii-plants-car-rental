import "server-only";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { BookingError } from "@/lib/booking/errors";
import { tryGetDb } from "@/lib/db";
import {
  attemptLatePaymentReallocation,
  confirmAllocation,
  expireStaleAllocation,
  lockBookingForPayment,
} from "@/lib/payments/late-reallocation";
import { transitionBookingStatus } from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";

export async function confirmReviewBookingFromPayment(input: {
  bookingId: string;
  staffId: string;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  await db.transaction(async (tx) => {
    const booking = await lockBookingForPayment(tx, input.bookingId);
    if (!booking) {
      throw new BookingError("BOOKING_NOT_FOUND", "That booking was not found.");
    }
    if (booking.status !== "under_review") {
      throw new BookingError(
        "INVALID_STATUS_TRANSITION",
        "Only bookings under availability review can be confirmed this way.",
      );
    }

    if (booking.vehicleAllocationId) {
      await expireStaleAllocation(tx, booking.vehicleAllocationId);
    }

    const reallocated = await attemptLatePaymentReallocation(tx, booking);
    if (!reallocated) {
      throw new BookingError(
        "VEHICLE_UNAVAILABLE",
        "No vehicles are available for these dates. Try different dates or assign a vehicle manually.",
      );
    }
    await confirmAllocation(tx, reallocated.allocationId);
    await transitionBookingStatus(tx, {
      bookingId: booking.id,
      fromStatus: "under_review",
      toStatus: "confirmed",
      actorType: "staff",
      actorId: input.staffId,
      reason: "Verified payment with manual availability confirmation.",
      metadata: { allocationId: reallocated.allocationId },
    });
  });

  await writeAuditLog({
    actorType: "staff",
    actorId: input.staffId,
    action: "late_payment_reallocated",
    entityType: "booking",
    entityId: input.bookingId,
  });

  log("info", "late_payment_reallocated", {
    bookingId: input.bookingId,
    staffId: input.staffId,
  });

  const { notifyBookingConfirmedAfterReview } = await import("@/lib/payments/notify");
  await notifyBookingConfirmedAfterReview(input.bookingId);
}
