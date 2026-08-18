import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { BookingError } from "@/lib/booking/errors";
import { HOLD_EXPIRED_MESSAGE } from "@/lib/bookings/constants";
import { notifyBookingCreated } from "@/lib/bookings/notify";
import { isUniqueViolation } from "@/lib/fleet/action-helpers";
import { tryGetDb } from "@/lib/db";
import {
  bookingStatusHistory,
  bookings,
  customers,
  quotes,
  vehicleAllocations,
  vehicles,
} from "@/lib/db/schema";
import { generateBookingReference } from "@/lib/bookings/generate-booking-reference";
import {
  normalizeEmail,
  normalizeLicenceCountry,
  normalizeLicenceNumber,
  normalizePersonName,
  normalizePhone,
} from "@/lib/bookings/normalize-customer";
import {
  auditBookingEvent,
  transitionBookingStatus,
} from "@/lib/bookings/transition-booking-status";
import { log } from "@/lib/logger";
import type { CustomerDetailsValues } from "@/lib/validation/booking";

export async function createBookingFromQuote(input: CustomerDetailsValues) {
  const db = tryGetDb();
  if (!db) {
    throw new BookingError(
      "QUOTE_EXPIRED",
      "This quote has expired. Please check availability again.",
    );
  }

  log("info", "booking_creation_attempt", { quoteId: input.quoteId });

  try {
    const created = await db.transaction(async (tx) => {
      const [quote] = await tx
        .select()
        .from(quotes)
        .where(eq(quotes.id, input.quoteId))
        .for("update");

      if (!quote) {
        throw new BookingError(
          "QUOTE_EXPIRED",
          "This quote has expired. Please check availability again.",
        );
      }

      const [existing] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.quoteId, quote.id))
        .limit(1);
      if (existing) {
        return existing;
      }

      if (quote.expiresAt.getTime() <= Date.now()) {
        throw new BookingError(
          "QUOTE_EXPIRED",
          "This quote has expired. Please check availability again.",
        );
      }

      const [allocation] = await tx
        .select()
        .from(vehicleAllocations)
        .where(
          and(
            eq(vehicleAllocations.quoteId, quote.id),
            eq(vehicleAllocations.status, "hold"),
          ),
        )
        .for("update");

      if (
        !allocation ||
        !allocation.expiresAt ||
        allocation.expiresAt.getTime() <= Date.now()
      ) {
        throw new BookingError("HOLD_EXPIRED", HOLD_EXPIRED_MESSAGE);
      }

      const [vehicle] = await tx
        .select({ id: vehicles.id })
        .from(vehicles)
        .where(eq(vehicles.id, allocation.vehicleId))
        .limit(1);
      if (!vehicle) {
        throw new BookingError("HOLD_EXPIRED", HOLD_EXPIRED_MESSAGE);
      }

      if (
        quote.rentalTotal < 0 ||
        quote.reservationPayment < 0 ||
        quote.remainingBalance < 0 ||
        quote.securityDepositRequired < 0
      ) {
        throw new BookingError(
          "QUOTE_EXPIRED",
          "This quote is no longer valid. Please check availability again.",
        );
      }

      const email = normalizeEmail(input.email);
      const phone = normalizePhone(input.phone);
      const firstName = normalizePersonName(input.firstName);
      const lastName = normalizePersonName(input.lastName);

      const [existingCustomer] = await tx
        .select()
        .from(customers)
        .where(sql`lower(btrim(${customers.email})) = ${email}`)
        .limit(1);

      let customer = existingCustomer;
      if (!customer) {
        try {
          const [inserted] = await tx
            .insert(customers)
            .values({
              firstName,
              lastName,
              email,
              phone,
            })
            .returning();
          customer = inserted;
        } catch (error) {
          if (!isUniqueViolation(error)) {
            throw error;
          }
          const [retry] = await tx
            .select()
            .from(customers)
            .where(sql`lower(btrim(${customers.email})) = ${email}`)
            .limit(1);
          customer = retry;
        }
      }

      if (!customer) {
        throw new BookingError(
          "QUOTE_EXPIRED",
          "We could not save your details. Please try again.",
        );
      }

      if (existingCustomer) {
        await tx
          .update(customers)
          .set({ firstName, lastName, phone })
          .where(eq(customers.id, existingCustomer.id));
      }

      let reference = generateBookingReference();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const [clash] = await tx
          .select({ id: bookings.id })
          .from(bookings)
          .where(eq(bookings.reference, reference))
          .limit(1);
        if (!clash) {
          break;
        }
        reference = generateBookingReference();
      }

      const [draft] = await tx
        .insert(bookings)
        .values({
          reference,
          status: "draft",
          customerId: customer.id,
          quoteId: quote.id,
          vehicleModelId: quote.vehicleModelId,
          vehicleClassId: quote.vehicleClassId,
          vehicleId: allocation.vehicleId,
          vehicleAllocationId: allocation.id,
          pickupLocationId: quote.pickupLocationId,
          returnLocationId: quote.returnLocationId,
          pickupAt: quote.pickupAt,
          returnAt: quote.returnAt,
          rentalTotal: quote.rentalTotal,
          reservationPaymentRequired: quote.reservationPayment,
          remainingBalance: quote.remainingBalance,
          securityDepositRequired: quote.securityDepositRequired,
          amountPaid: 0,
          driverAge: input.driverAge,
          licenceCountry: normalizeLicenceCountry(input.licenceCountry),
          licenceNumber: normalizeLicenceNumber(input.licenceNumber),
          customerNotes: input.customerNotes?.trim() || null,
        })
        .returning();

      if (!draft) {
        throw new BookingError(
          "QUOTE_EXPIRED",
          "We could not create the booking. Please try again.",
        );
      }

      await tx.insert(bookingStatusHistory).values({
        bookingId: draft.id,
        fromStatus: null,
        toStatus: "draft",
        actorType: "customer",
      });

      await tx
        .update(vehicleAllocations)
        .set({ bookingId: draft.id })
        .where(eq(vehicleAllocations.id, allocation.id));

      await transitionBookingStatus(tx, {
        bookingId: draft.id,
        fromStatus: "draft",
        toStatus: "held",
        actorType: "system",
      });
      await transitionBookingStatus(tx, {
        bookingId: draft.id,
        fromStatus: "held",
        toStatus: "payment_pending",
        actorType: "system",
      });

      const [finalBooking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, draft.id))
        .limit(1);

      return finalBooking ?? draft;
    });

    log("info", "booking_created", {
      bookingId: created.id,
      reference: created.reference,
      quoteId: created.quoteId,
      status: created.status,
    });

    await auditBookingEvent({
      actorType: "customer",
      action: "booking_created",
      bookingId: created.id,
      metadata: { reference: created.reference },
    });

    try {
      await notifyBookingCreated(created.id);
    } catch {
      log("warn", "booking_created_email_failed", { bookingId: created.id });
    }

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      const dbRetry = tryGetDb();
      if (dbRetry) {
        const [existing] = await dbRetry
          .select()
          .from(bookings)
          .where(eq(bookings.quoteId, input.quoteId))
          .limit(1);
        if (existing) {
          return existing;
        }
      }
    }

    log("warn", "booking_creation_failed", {
      quoteId: input.quoteId,
      code: error instanceof BookingError ? error.code : "unknown",
    });
    throw error;
  }
}
