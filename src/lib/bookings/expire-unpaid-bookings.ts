import "server-only";

import { and, eq, inArray, or, sql } from "drizzle-orm";

import { expireVehicleHolds } from "@/lib/availability/expire-holds";
import { notifyBookingExpired } from "@/lib/bookings/notify";
import { tryGetDb } from "@/lib/db";
import { bookings, vehicleAllocations } from "@/lib/db/schema";
import {
  auditBookingEvent,
  cancelAllocationHold,
  transitionBookingStatus,
} from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";
import type { BookingStatus } from "@/lib/bookings/status";

const PRE_PAYMENT: BookingStatus[] = ["draft", "held"];
const PAYMENT_PENDING: BookingStatus = "payment_pending";

export async function expireUnpaidBookings() {
  const db = tryGetDb();
  if (!db) {
    return 0;
  }

  await expireVehicleHolds();

  const stale = await db
    .select({
      booking: bookings,
    })
    .from(bookings)
    .leftJoin(
      vehicleAllocations,
      eq(bookings.vehicleAllocationId, vehicleAllocations.id),
    )
    .where(
      and(
        inArray(bookings.status, PRE_PAYMENT),
        or(
          sql`${vehicleAllocations.id} is null`,
          sql`${vehicleAllocations.status} in ('expired', 'cancelled')`,
          and(
            eq(vehicleAllocations.status, "hold"),
            sql`${vehicleAllocations.expiresAt} is not null`,
            sql`${vehicleAllocations.expiresAt} <= now()`,
          ),
        ),
      ),
    );

  let expired = 0;
  for (const row of stale) {
    await db.transaction(async (tx) => {
      if (row.booking.status === "held") {
        await transitionBookingStatus(tx, {
          bookingId: row.booking.id,
          fromStatus: "held",
          toStatus: "expired",
          actorType: "system",
          reason: "Temporary vehicle hold expired before payment.",
        });
      } else if (row.booking.status === "draft") {
        await transitionBookingStatus(tx, {
          bookingId: row.booking.id,
          fromStatus: "draft",
          toStatus: "expired",
          actorType: "system",
          reason: "Temporary vehicle hold expired before payment.",
        });
      }
      await cancelAllocationHold(tx, row.booking.vehicleAllocationId);
    });
    await auditBookingEvent({
      actorType: "system",
      action: "booking_expired",
      bookingId: row.booking.id,
    });
    log("info", "booking_expired", { bookingId: row.booking.id });
    try {
      await notifyBookingExpired(row.booking.id);
    } catch {
      log("warn", "booking_expired_email_failed", { bookingId: row.booking.id });
    }
    expired += 1;
  }

  return expired;
}

export async function ensureBookingNotExpired<T extends { id: string; status: BookingStatus; vehicleAllocationId: string | null }>(
  booking: T,
): Promise<T> {
  if (!PRE_PAYMENT.includes(booking.status) && booking.status !== PAYMENT_PENDING) {
    return booking;
  }

  if (booking.status === PAYMENT_PENDING) {
    return booking;
  }

  await expireUnpaidBookings();
  const db = tryGetDb();
  if (!db) {
    return booking;
  }

  const [fresh] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, booking.id))
    .limit(1);
  return (fresh as T | undefined) ?? booking;
}
