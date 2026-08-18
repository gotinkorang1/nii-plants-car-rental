import "server-only";

import { eq } from "drizzle-orm";

import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { getBookingEmailCopy } from "@/lib/bookings/notify";
import { tryGetDb } from "@/lib/db";
import { bookings, payments } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email/send-email";
import {
  bookingConfirmedEmail,
  paymentAvailabilityReviewEmail,
  paymentReceivedEmail,
} from "@/lib/email/templates";
import { paymentPurposeLabel } from "@/lib/payments/reconcile-paystack-payment";
import { log } from "@/lib/logger";

function paidAtLabel(at: Date | null) {
  if (!at) {
    return "Pending confirmation";
  }
  return `${utcToAccraDateInput(at)} ${utcToAccraTimeInput(at)}`;
}

export async function notifyPaymentReconciled(input: {
  paymentId: string;
  bookingConfirmed: boolean;
  reviewRequired: boolean;
}) {
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const [row] = await db
    .select({
      payment: payments,
      booking: bookings,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(eq(payments.id, input.paymentId))
    .limit(1);

  if (!row) {
    return;
  }

  const copy = await getBookingEmailCopy(row.booking.id);
  if (!copy) {
    return;
  }

  if (input.reviewRequired || row.booking.status === "under_review") {
    const result = await sendEmail({
      to: copy.email,
      email: paymentAvailabilityReviewEmail({
        firstName: copy.firstName,
        reference: copy.reference,
        amount: row.payment.amount,
        providerReference: row.payment.providerReference,
      }),
    });
    if (!result.ok) {
      log("warn", "payment_review_email_failed", { paymentId: input.paymentId });
    }
    return;
  }

  const receipt = await sendEmail({
    to: copy.email,
    email: paymentReceivedEmail({
      firstName: copy.firstName,
      reference: copy.reference,
      purposeLabel: paymentPurposeLabel(row.payment.purpose),
      amount: row.payment.amount,
      providerReference: row.payment.providerReference,
      paidAtLabel: paidAtLabel(row.payment.paidAt),
      remainingBalance: row.booking.remainingBalance,
    }),
  });
  if (!receipt.ok) {
    log("warn", "payment_received_email_failed", { paymentId: input.paymentId });
  }

  if (input.bookingConfirmed) {
    const [freshBooking] = await db
      .select({ amountPaid: bookings.amountPaid, remainingBalance: bookings.remainingBalance })
      .from(bookings)
      .where(eq(bookings.id, row.booking.id))
      .limit(1);

    const confirmed = await sendEmail({
      to: copy.email,
      email: bookingConfirmedEmail({
        ...copy,
        amountPaid: freshBooking?.amountPaid ?? row.booking.amountPaid,
        remainingBalance: freshBooking?.remainingBalance ?? row.booking.remainingBalance,
      }),
    });
    if (!confirmed.ok) {
      log("warn", "booking_confirmed_email_failed", { bookingId: row.booking.id });
    }
  }
}

export async function notifyBookingConfirmedAfterReview(bookingId: string) {
  const copy = await getBookingEmailCopy(bookingId);
  if (!copy) {
    return;
  }
  const db = tryGetDb();
  if (!db) {
    return;
  }
  const [booking] = await db
    .select({ amountPaid: bookings.amountPaid, remainingBalance: bookings.remainingBalance })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);
  if (!booking) {
    return;
  }
  const result = await sendEmail({
    to: copy.email,
    email: bookingConfirmedEmail({
      ...copy,
      amountPaid: booking.amountPaid,
      remainingBalance: booking.remainingBalance,
    }),
  });
  if (!result.ok) {
    log("warn", "booking_confirmed_email_failed", { bookingId });
  }
}
