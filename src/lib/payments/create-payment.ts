import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { sanitizeAuditMetadata } from "@/lib/audit/sanitize";
import { readBookingGuestSession } from "@/lib/bookings/guest-session";
import { tryGetDb } from "@/lib/db";
import { auditLogs, bookings, customers, payments } from "@/lib/db/schema";
import { isUniqueViolation } from "@/lib/fleet/action-helpers";
import {
  INITIAL_PAYMENT_PURPOSES,
  OPEN_PAYMENT_STATUSES,
  PAYSTACK_CURRENCY,
  PAYSTACK_PROVIDER,
} from "@/lib/payments/constants";
import {
  determineInitialPaymentPurpose,
  initialPaymentAmount,
} from "@/lib/payments/determine-initial-purpose";
import { PaymentError } from "@/lib/payments/errors";
import { allocationHoldActive, lockBookingForPayment } from "@/lib/payments/late-reallocation";
import { generatePaymentReference } from "@/lib/payments/generate-payment-reference";
import {
  paystackCallbackUrl,
  paystackConfigured,
} from "@/lib/payments/paystack/config";
import { initializePaystackTransaction } from "@/lib/payments/paystack/initialize";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import {
  assertOnlinePaymentEnabled,
  assertSelfDriveBookingEnabled,
} from "@/lib/settings/operational-guards";
import { log } from "@/lib/logger";

export type CreatePaymentInput = {
  bookingId: string;
  purpose?: "initial" | "balance";
};

export type CreatePaymentResult = {
  paymentId: string;
  providerReference: string;
  authorizationUrl: string;
  purpose: "reservation" | "full_rental" | "balance";
  amount: number;
  reused: boolean;
};

async function assertGuestBookingAccess(bookingId: string) {
  const session = await readBookingGuestSession();
  if (!session || session.bookingId !== bookingId) {
    throw new PaymentError(
      "BOOKING_ACCESS_DENIED",
      "Sign in to this booking before paying online.",
    );
  }
  return session;
}

export async function createPaymentAttempt(
  input: CreatePaymentInput,
): Promise<CreatePaymentResult> {
  if (!paystackConfigured()) {
    throw new PaymentError(
      "PAYSTACK_NOT_CONFIGURED",
      "Online payment is not configured yet.",
    );
  }

  const callbackUrl = paystackCallbackUrl();
  if (!callbackUrl) {
    throw new PaymentError(
      "PAYSTACK_NOT_CONFIGURED",
      "Online payment callback URL is not configured.",
    );
  }

  await assertGuestBookingAccess(input.bookingId);
  const db = tryGetDb();
  if (!db) {
    throw new PaymentError("PAYSTACK_NOT_CONFIGURED", "Payments are not configured.");
  }

  const settings = await getSiteSettings();
  assertSelfDriveBookingEnabled(settings);
  assertOnlinePaymentEnabled(settings);

  try {
    const result: CreatePaymentResult = await db.transaction(async (tx) => {
      const booking = await lockBookingForPayment(tx, input.bookingId);
      if (!booking) {
        throw new PaymentError("BOOKING_NOT_FOUND", "That booking was not found.");
      }

      const [customer] = await tx
        .select({ email: customers.email })
        .from(customers)
        .where(eq(customers.id, booking.customerId))
        .limit(1);
      if (!customer) {
        throw new PaymentError("BOOKING_NOT_FOUND", "That booking was not found.");
      }

      let purpose: "reservation" | "full_rental" | "balance";
      let amount: number;

      if (input.purpose === "balance") {
        if (booking.status !== "confirmed") {
          throw new PaymentError(
            "PAYMENT_NOT_ALLOWED",
            "Remaining balance payments are available after the booking is confirmed.",
          );
        }
        if (booking.remainingBalance <= 0) {
          throw new PaymentError(
            "PAYMENT_NOT_ALLOWED",
            "This booking has no remaining rental balance.",
          );
        }
        purpose = "balance";
        amount = booking.remainingBalance;
      } else {
        if (booking.status !== "payment_pending") {
          throw new PaymentError(
            "PAYMENT_NOT_ALLOWED",
            "This booking is not awaiting its initial payment.",
          );
        }

        const initialPurpose = determineInitialPaymentPurpose({
          pickupAt: booking.pickupAt,
          balanceDueHours: settings.balanceDueHours,
        });
        purpose = initialPurpose;
        amount = initialPaymentAmount({
          purpose: initialPurpose,
          rentalTotal: booking.rentalTotal,
          reservationPaymentRequired: booking.reservationPaymentRequired,
        });

        const holdActive = await allocationHoldActive(tx, booking.vehicleAllocationId);
        if (!holdActive && booking.vehicleAllocationId) {
          log("info", "payment_initialization", {
            bookingId: booking.id,
            note: "hold_expired_initial_payment_allowed",
          });
        }
      }

      if (input.purpose !== "balance") {
        const openInitial = await tx
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.bookingId, booking.id),
              inArray(payments.purpose, [...INITIAL_PAYMENT_PURPOSES]),
              inArray(payments.status, [...OPEN_PAYMENT_STATUSES]),
            ),
          )
          .limit(1);

        if (openInitial[0]?.authorizationUrl) {
          return {
            paymentId: openInitial[0].id,
            providerReference: openInitial[0].providerReference,
            authorizationUrl: openInitial[0].authorizationUrl,
            purpose: openInitial[0].purpose as "reservation" | "full_rental",
            amount: openInitial[0].amount,
            reused: true,
          };
        }
      } else {
        const existingBalance = await tx
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.bookingId, booking.id),
              eq(payments.purpose, "balance"),
              inArray(payments.status, [...OPEN_PAYMENT_STATUSES]),
            ),
          )
          .limit(1);

        if (existingBalance[0]?.authorizationUrl) {
          return {
            paymentId: existingBalance[0].id,
            providerReference: existingBalance[0].providerReference,
            authorizationUrl: existingBalance[0].authorizationUrl,
            purpose: "balance",
            amount: existingBalance[0].amount,
            reused: true,
          };
        }
      }

      if (input.purpose !== "balance") {
        const succeededInitial = await tx
          .select({ id: payments.id })
          .from(payments)
          .where(
            and(
              eq(payments.bookingId, booking.id),
              inArray(payments.purpose, [...INITIAL_PAYMENT_PURPOSES]),
              eq(payments.status, "succeeded"),
            ),
          )
          .limit(1);
        if (succeededInitial[0]) {
          throw new PaymentError(
            "PAYMENT_NOT_ALLOWED",
            "The initial payment for this booking has already been received.",
          );
        }
      }

      let providerReference = generatePaymentReference();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const [clash] = await tx
          .select({ id: payments.id })
          .from(payments)
          .where(eq(payments.providerReference, providerReference))
          .limit(1);
        if (!clash) {
          break;
        }
        providerReference = generatePaymentReference();
      }

      const [created] = await tx
        .insert(payments)
        .values({
          bookingId: booking.id,
          purpose,
          amount,
          currency: PAYSTACK_CURRENCY,
          provider: PAYSTACK_PROVIDER,
          providerReference,
          status: "created",
        })
        .returning();

      if (!created) {
        throw new PaymentError(
          "PAYSTACK_INITIALIZATION_FAILED",
          "We could not start the payment. Please try again.",
        );
      }

      let initialized;
      try {
        initialized = await initializePaystackTransaction({
          email: customer.email,
          amount,
          reference: providerReference,
          callbackUrl,
          metadata: {
            paymentId: created.id,
            bookingReference: booking.reference,
            paymentPurpose: purpose,
          },
        });
      } catch (error) {
        await tx
          .update(payments)
          .set({
            status: "failed",
            failureReason:
              error instanceof Error ? error.message : "Paystack initialization failed.",
          })
          .where(eq(payments.id, created.id));
        throw new PaymentError(
          "PAYSTACK_INITIALIZATION_FAILED",
          "We could not open secure payment. Please try again shortly.",
        );
      }

      const [pending] = await tx
        .update(payments)
        .set({
          status: "provider_pending",
          authorizationUrl: initialized.authorizationUrl,
          accessCode: initialized.accessCode,
        })
        .where(eq(payments.id, created.id))
        .returning();

      await tx.insert(auditLogs).values({
        actorType: "customer",
        actorId: null,
        action: "payment_initialized",
        entityType: "payment",
        entityId: created.id,
        metadata: sanitizeAuditMetadata({
          bookingId: booking.id,
          purpose,
          amount,
          providerReference,
        }),
      });

      log("info", "payment_initialization", {
        bookingId: booking.id,
        paymentId: created.id,
        purpose,
        amount,
        providerReference,
      });

      return {
        paymentId: pending?.id ?? created.id,
        providerReference,
        authorizationUrl: initialized.authorizationUrl,
        purpose,
        amount,
        reused: false,
      };
    });

    return result;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const [existing] = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.bookingId, input.bookingId),
            inArray(payments.status, [...OPEN_PAYMENT_STATUSES]),
          ),
        )
        .limit(1);
      if (existing?.authorizationUrl) {
        return {
          paymentId: existing.id,
          providerReference: existing.providerReference,
          authorizationUrl: existing.authorizationUrl,
          purpose: existing.purpose as CreatePaymentResult["purpose"],
          amount: existing.amount,
          reused: true,
        };
      }
    }
    throw error;
  }
}

export async function getPaymentStatusForGuest(providerReference: string) {
  const db = tryGetDb();
  if (!db) {
    return { status: "not_found" as const };
  }

  const [payment] = await db
    .select({
      id: payments.id,
      bookingId: payments.bookingId,
      status: payments.status,
      reviewRequired: payments.reviewRequired,
      purpose: payments.purpose,
      amount: payments.amount,
      providerReference: payments.providerReference,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.providerReference, providerReference))
    .limit(1);

  if (!payment) {
    return { status: "not_found" as const };
  }

  const session = await readBookingGuestSession();
  const hasSession = Boolean(session && session.bookingId === payment.bookingId);

  let booking: { reference: string; status: string; remainingBalance: number } | null =
    null;
  if (hasSession) {
    const [row] = await db
      .select({
        reference: bookings.reference,
        status: bookings.status,
        remainingBalance: bookings.remainingBalance,
      })
      .from(bookings)
      .where(eq(bookings.id, payment.bookingId))
      .limit(1);
    booking = row ?? null;
  }

  const publicStatus =
    payment.reviewRequired || payment.status === "succeeded" && booking?.status === "under_review"
      ? ("review" as const)
      : payment.status === "succeeded"
        ? ("succeeded" as const)
        : payment.status === "failed" || payment.status === "cancelled"
          ? ("failed" as const)
          : ("pending" as const);

  return {
    status: publicStatus,
    payment,
    booking,
    hasSession,
  };
}

export async function listBookingPaymentHistory(bookingId: string) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      reference: payments.providerReference,
      purpose: payments.purpose,
      amount: payments.amount,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .where(eq(payments.bookingId, bookingId))
    .orderBy(payments.createdAt);
}
