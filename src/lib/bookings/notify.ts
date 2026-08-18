import "server-only";

import { tryGetDb } from "@/lib/db";
import {
  bookings,
  customers,
  vehicleModels,
} from "@/lib/db/schema";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { publicEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/send-email";
import {
  bookingAccessCodeEmail,
  bookingCancelledEmail,
  bookingCreatedEmail,
  bookingExpiredEmail,
  type BookingEmailCopy,
} from "@/lib/email/templates";
import { OTP_EXPIRY_MINUTES } from "@/lib/bookings/constants";
import { log } from "@/lib/logger";
import { eq } from "drizzle-orm";

function accessUrl() {
  const base = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  return base ? `${base}/booking` : "/booking";
}

function tripLabel(at: Date) {
  return `${utcToAccraDateInput(at)} ${utcToAccraTimeInput(at)}`;
}

export async function getBookingEmailCopy(
  bookingId: string,
): Promise<BookingEmailCopy | null> {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      reference: bookings.reference,
      firstName: customers.firstName,
      email: customers.email,
      make: vehicleModels.make,
      model: vehicleModels.model,
      pickupAt: bookings.pickupAt,
      returnAt: bookings.returnAt,
      rentalTotal: bookings.rentalTotal,
      reservationPaymentRequired: bookings.reservationPaymentRequired,
      remainingBalance: bookings.remainingBalance,
      securityDepositRequired: bookings.securityDepositRequired,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    firstName: row.firstName,
    email: row.email,
    reference: row.reference,
    vehicleLabel: `${row.make} ${row.model} or similar`,
    pickupLabel: tripLabel(row.pickupAt),
    returnLabel: tripLabel(row.returnAt),
    rentalTotal: row.rentalTotal,
    reservationPaymentRequired: row.reservationPaymentRequired,
    remainingBalance: row.remainingBalance,
    securityDepositRequired: row.securityDepositRequired,
    accessUrl: accessUrl(),
  };
}

async function sendCopy(
  bookingId: string,
  render: (copy: BookingEmailCopy) => ReturnType<typeof bookingCreatedEmail>,
  failureEvent: string,
) {
  const copy = await getBookingEmailCopy(bookingId);
  if (!copy) {
    return;
  }
  const result = await sendEmail({
    to: copy.email,
    email: render(copy),
  });
  if (!result.ok) {
    log("warn", failureEvent, { bookingId });
  }
}

export async function notifyBookingCreated(bookingId: string) {
  await sendCopy(bookingId, bookingCreatedEmail, "booking_created_email_failed");
}

export async function notifyBookingCancelled(bookingId: string) {
  await sendCopy(bookingId, bookingCancelledEmail, "booking_cancelled_email_failed");
}

export async function notifyBookingExpired(bookingId: string) {
  await sendCopy(bookingId, bookingExpiredEmail, "booking_expired_email_failed");
}

export async function sendBookingAccessCode(input: {
  email: string;
  firstName: string;
  reference: string;
  code: string;
}) {
  return sendEmail({
    to: input.email,
    otp: input.code,
    email: bookingAccessCodeEmail({
      firstName: input.firstName,
      reference: input.reference,
      code: input.code,
      expiresMinutes: OTP_EXPIRY_MINUTES,
    }),
  });
}
