import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { sanitizeAuditMetadata } from "@/lib/audit/sanitize";
import { tryGetDb } from "@/lib/db";
import { auditLogs, bookings, payments } from "@/lib/db/schema";
import {
  computeRemainingBalance,
  rentalPaymentPurpose,
  sumSuccessfulRentalPayments,
} from "@/lib/payments/financial-summary";
import { PaymentError } from "@/lib/payments/errors";
import {
  allocationHoldActive,
  attemptLatePaymentReallocation,
  confirmAllocation,
  expireStaleAllocation,
  lockBookingForPayment,
} from "@/lib/payments/late-reallocation";
import { sanitizePaystackSnapshot } from "@/lib/payments/paystack/sanitize";
import { verifyPaystackTransaction } from "@/lib/payments/paystack/verify";
import type {
  PaymentPurpose,
  PublicPaymentStatus,
  PaystackVerification,
} from "@/lib/payments/types";
import { transitionBookingStatus } from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";
import { INITIAL_PAYMENT_PURPOSES } from "@/lib/payments/constants";

export type ReconcilePaystackPaymentResult = {
  paymentId: string | null;
  providerReference: string;
  status: PublicPaymentStatus;
  bookingId: string | null;
  bookingReference: string | null;
  bookingStatus: string | null;
  alreadyProcessed: boolean;
  reviewRequired: boolean;
  bookingConfirmed: boolean;
  paymentSucceeded: boolean;
};

function toPublicStatus(input: {
  paymentStatus: string;
  reviewRequired: boolean;
}): PublicPaymentStatus {
  if (input.reviewRequired) {
    return "review";
  }
  if (input.paymentStatus === "succeeded") {
    return "succeeded";
  }
  if (input.paymentStatus === "failed" || input.paymentStatus === "cancelled") {
    return "failed";
  }
  return "pending";
}

function verificationMatchesPayment(
  verification: PaystackVerification,
  payment: typeof payments.$inferSelect,
) {
  return (
    verification.status === "success" &&
    verification.reference === payment.providerReference &&
    verification.amount === payment.amount &&
    verification.currency === payment.currency
  );
}

async function loadSuccessfulRentalPayments(
  tx: Parameters<Parameters<NonNullable<ReturnType<typeof tryGetDb>>["transaction"]>[0]>[0],
  bookingId: string,
  excludePaymentId?: string,
) {
  const rows = await tx
    .select({ purpose: payments.purpose, amount: payments.amount, id: payments.id })
    .from(payments)
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.status, "succeeded"),
        inArray(payments.purpose, ["reservation", "full_rental", "balance"]),
      ),
    );

  return rows.filter((row) => row.id !== excludePaymentId);
}

export async function reconcilePaystackPayment(
  providerReference: string,
  source: "webhook" | "callback" | "admin" = "webhook",
): Promise<ReconcilePaystackPaymentResult> {
  const db = tryGetDb();
  if (!db) {
    throw new PaymentError("PAYMENT_NOT_FOUND", "Payments are not configured.");
  }

  log("info", "payment_reconciled", { providerReference, source });

  let verification: PaystackVerification;
  try {
    verification = await verifyPaystackTransaction(providerReference);
  } catch (error) {
    log("warn", "paystack_verification_failed", {
      providerReference,
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      paymentId: null,
      providerReference,
      status: "failed",
      bookingId: null,
      bookingReference: null,
      bookingStatus: null,
      alreadyProcessed: false,
      reviewRequired: false,
      bookingConfirmed: false,
      paymentSucceeded: false,
    };
  }

  const outcome = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.providerReference, providerReference))
      .for("update");

    if (!payment) {
      log("warn", "payment_review", {
        providerReference,
        reason: "unknown_reference",
      });
      return {
        paymentId: null,
        providerReference,
        status: "not_found" as PublicPaymentStatus,
        bookingId: null,
        bookingReference: null,
        bookingStatus: null,
        alreadyProcessed: false,
        reviewRequired: false,
        bookingConfirmed: false,
        paymentSucceeded: false,
      };
    }

    if (payment.status === "succeeded") {
      const [booking] = await tx
        .select({ reference: bookings.reference, status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, payment.bookingId))
        .limit(1);
      return {
        paymentId: payment.id,
        providerReference,
        status: toPublicStatus({
          paymentStatus: payment.status,
          reviewRequired: payment.reviewRequired,
        }),
        bookingId: payment.bookingId,
        bookingReference: booking?.reference ?? null,
        bookingStatus: booking?.status ?? null,
        alreadyProcessed: true,
        reviewRequired: payment.reviewRequired,
        bookingConfirmed: booking?.status === "confirmed",
        paymentSucceeded: true,
      };
    }

    const booking = await lockBookingForPayment(tx, payment.bookingId);
    if (!booking) {
      throw new PaymentError("BOOKING_NOT_FOUND", "That booking was not found.");
    }

    const snapshot = sanitizePaystackSnapshot(verification);
    let reviewRequired = false;
    let reviewReason: string | null = null;
    let paymentSucceeded = false;
    let bookingConfirmed = booking.status === "confirmed";
    const previousBookingStatus = booking.status;

    if (verification.status !== "success") {
      await tx
        .update(payments)
        .set({
          status: verification.status === "failed" ? "failed" : "provider_pending",
          providerSnapshot: snapshot,
          failureReason: verification.gatewayResponse,
        })
        .where(eq(payments.id, payment.id));

      return {
        paymentId: payment.id,
        providerReference,
        status: "pending" as PublicPaymentStatus,
        bookingId: booking.id,
        bookingReference: booking.reference,
        bookingStatus: booking.status,
        alreadyProcessed: false,
        reviewRequired: false,
        bookingConfirmed,
        paymentSucceeded: false,
      };
    }

    if (!verificationMatchesPayment(verification, payment)) {
      reviewRequired = true;
      reviewReason =
        verification.currency !== payment.currency
          ? "currency_mismatch"
          : verification.amount !== payment.amount
            ? "amount_mismatch"
            : "reference_mismatch";
    }

    const priorSuccessful = await loadSuccessfulRentalPayments(tx, booking.id, payment.id);
    const priorInitial = priorSuccessful.some((row) =>
      INITIAL_PAYMENT_PURPOSES.includes(row.purpose as (typeof INITIAL_PAYMENT_PURPOSES)[number]),
    );
    const projectedPaid =
      sumSuccessfulRentalPayments(priorSuccessful) +
      (rentalPaymentPurpose(payment.purpose) ? payment.amount : 0);

    if (
      rentalPaymentPurpose(payment.purpose) &&
      INITIAL_PAYMENT_PURPOSES.includes(
        payment.purpose as (typeof INITIAL_PAYMENT_PURPOSES)[number],
      ) &&
      priorInitial
    ) {
      reviewRequired = true;
      reviewReason = reviewReason ?? "duplicate_initial_payment";
    }

    if (projectedPaid > booking.rentalTotal && rentalPaymentPurpose(payment.purpose)) {
      reviewRequired = true;
      reviewReason = reviewReason ?? "overpayment";
    }

    if (
      payment.purpose === "balance" &&
      !["confirmed", "ready", "checked_out", "completed", "under_review"].includes(
        booking.status,
      )
    ) {
      reviewRequired = true;
      reviewReason = reviewReason ?? "balance_before_confirmation";
    }

    await tx
      .update(payments)
      .set({
        status: "succeeded",
        paidAt: verification.paidAt ?? new Date(),
        providerTransactionId: verification.transactionId,
        providerSnapshot: snapshot,
        reviewRequired,
        reviewReason,
        failureReason: null,
      })
      .where(eq(payments.id, payment.id));
    paymentSucceeded = true;

    const amountPaid = rentalPaymentPurpose(payment.purpose)
      ? projectedPaid
      : booking.amountPaid;
    const remainingBalance = computeRemainingBalance(booking.rentalTotal, amountPaid);

    await tx
      .update(bookings)
      .set({
        amountPaid,
        remainingBalance,
      })
      .where(eq(bookings.id, booking.id));

    let nextBookingStatus = booking.status;

    if (
      !reviewRequired &&
      INITIAL_PAYMENT_PURPOSES.includes(
        payment.purpose as (typeof INITIAL_PAYMENT_PURPOSES)[number],
      ) &&
      booking.status === "payment_pending"
    ) {
      const holdActive = await allocationHoldActive(tx, booking.vehicleAllocationId);
      if (holdActive) {
        if (booking.vehicleAllocationId) {
          await confirmAllocation(tx, booking.vehicleAllocationId);
        }
        await transitionBookingStatus(tx, {
          bookingId: booking.id,
          fromStatus: "payment_pending",
          toStatus: "confirmed",
          actorType: "payment",
          metadata: { paymentId: payment.id, providerReference },
        });
        nextBookingStatus = "confirmed";
        bookingConfirmed = true;
      } else {
        if (booking.vehicleAllocationId) {
          await expireStaleAllocation(tx, booking.vehicleAllocationId);
        }
        const reallocated = await attemptLatePaymentReallocation(tx, booking);
        if (reallocated) {
          await confirmAllocation(tx, reallocated.allocationId);
          await transitionBookingStatus(tx, {
            bookingId: booking.id,
            fromStatus: "payment_pending",
            toStatus: "confirmed",
            actorType: "payment",
            reason: "Verified payment after hold expiry with available capacity.",
            metadata: {
              paymentId: payment.id,
              providerReference,
              allocationId: reallocated.allocationId,
            },
          });
          nextBookingStatus = "confirmed";
          bookingConfirmed = true;
        } else {
          await transitionBookingStatus(tx, {
            bookingId: booking.id,
            fromStatus: "payment_pending",
            toStatus: "under_review",
            actorType: "payment",
            reason: "paid_after_hold_expiry_no_capacity",
            metadata: { paymentId: payment.id, providerReference },
          });
          nextBookingStatus = "under_review";
          reviewRequired = true;
          reviewReason = "paid_after_hold_expiry_no_capacity";
          await tx
            .update(payments)
            .set({ reviewRequired: true, reviewReason })
            .where(eq(payments.id, payment.id));
        }
      }
    } else if (
      reviewRequired &&
      INITIAL_PAYMENT_PURPOSES.includes(
        payment.purpose as (typeof INITIAL_PAYMENT_PURPOSES)[number],
      ) &&
      booking.status === "payment_pending" &&
      reviewReason === "paid_after_hold_expiry_no_capacity"
    ) {
      // handled above
    } else if (
      reviewRequired &&
      INITIAL_PAYMENT_PURPOSES.includes(
        payment.purpose as (typeof INITIAL_PAYMENT_PURPOSES)[number],
      ) &&
      booking.status === "payment_pending"
    ) {
      // amount mismatch etc - stay payment_pending, money recorded
    }

    await tx.insert(auditLogs).values({
      actorType: "system",
      actorId: null,
      action: reviewRequired ? "payment_review_required" : "payment_verified",
      entityType: "payment",
      entityId: payment.id,
      metadata: sanitizeAuditMetadata({
        providerReference,
        source,
        reviewReason,
        bookingId: booking.id,
        bookingStatus: nextBookingStatus,
      }),
    });

    if (bookingConfirmed && previousBookingStatus !== "confirmed") {
      await tx.insert(auditLogs).values({
        actorType: "system",
        actorId: null,
        action: "booking_confirmed_from_payment",
        entityType: "booking",
        entityId: booking.id,
        metadata: sanitizeAuditMetadata({ paymentId: payment.id, providerReference }),
      });
      log("info", "booking_confirmation", {
        bookingId: booking.id,
        paymentId: payment.id,
      });
    }

    return {
      paymentId: payment.id,
      providerReference,
      status: toPublicStatus({
        paymentStatus: "succeeded",
        reviewRequired,
      }),
      bookingId: booking.id,
      bookingReference: booking.reference,
      bookingStatus: nextBookingStatus,
      alreadyProcessed: false,
      reviewRequired,
      bookingConfirmed: bookingConfirmed && previousBookingStatus !== "confirmed",
      paymentSucceeded,
    };
  });

  if (outcome.paymentSucceeded && outcome.paymentId) {
    const { notifyPaymentReconciled } = await import("@/lib/payments/notify");
    await notifyPaymentReconciled({
      paymentId: outcome.paymentId,
      bookingConfirmed: outcome.bookingConfirmed,
      reviewRequired: outcome.reviewRequired,
    });
  }

  return outcome;
}

export function paymentPurposeLabel(purpose: PaymentPurpose): string {
  switch (purpose) {
    case "reservation":
      return "Reservation payment";
    case "full_rental":
      return "Full rental payment";
    case "balance":
      return "Remaining balance";
    default:
      return purpose;
  }
}
