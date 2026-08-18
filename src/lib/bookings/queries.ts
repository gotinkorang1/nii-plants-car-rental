import "server-only";

import { and, desc, eq, gte, ilike, lte, or, sql } from "drizzle-orm";

import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { calculateChargeableDays } from "@/lib/pricing/calculate-chargeable-days";
import { tryGetDb } from "@/lib/db";
import {
  bookingStatusHistory,
  bookings,
  customers,
  locations,
  quotes,
  vehicleAllocations,
  vehicleClasses,
  vehicleModels,
  vehicles,
} from "@/lib/db/schema";
import { expireUnpaidBookings } from "@/lib/bookings/expire-unpaid-bookings";
import {
  CUSTOMER_TIMELINE,
  CUSTOMER_TIMELINE_LABELS,
  customerStatusLabel,
  type BookingStatus,
} from "@/lib/bookings/status";
import { MODEL_OR_SIMILAR } from "@/lib/bookings/constants";
import { listBookingPaymentHistory } from "@/lib/payments/create-payment";
import {
  determineInitialPaymentPurpose,
} from "@/lib/payments/determine-initial-purpose";
import { paymentPurposeLabel } from "@/lib/payments/reconcile-paystack-payment";
import type { SafePaymentHistoryItem } from "@/lib/payments/types";
import type { BookingPrice } from "@/lib/pricing/types";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { toPublicContact } from "@/lib/settings/public-contact";
import { alias } from "drizzle-orm/pg-core";

const pickupLocations = alias(locations, "pickup_locations");
const returnLocations = alias(locations, "return_locations");

export type PublicBookingView = {
  reference: string;
  status: BookingStatus;
  statusLabel: string;
  pickupLabel: string;
  returnLabel: string;
  pickupLocation: string;
  returnLocation: string;
  durationDays: number;
  vehicleLabel: string;
  className: string;
  similarDisclosure: string;
  rentalTotal: number;
  amountPaid: number;
  reservationPaymentRequired: number;
  remainingBalance: number;
  securityDepositRequired: number;
  securityDepositSummary: string;
  holdExpiresAt: Date | null;
  holdActive: boolean;
  initialPaymentLabel: string;
  paymentHistory: Array<
    SafePaymentHistoryItem & { purposeLabel: string; statusLabel: string }
  >;
  timeline: { id: string; label: string; state: "done" | "current" | "upcoming" }[];
};

function tripLabel(at: Date) {
  return `${utcToAccraDateInput(at)} ${utcToAccraTimeInput(at)}`;
}

function timelineFor(status: BookingStatus) {
  if (status === "cancelled" || status === "expired" || status === "rejected") {
    return [
      { id: "created", label: "Booking created", state: "done" as const },
      {
        id: status,
        label: customerStatusLabel(status),
        state: "current" as const,
      },
    ];
  }

  const currentIndex = CUSTOMER_TIMELINE.indexOf(status);
  return [
    { id: "created", label: "Booking created", state: "done" as const },
    ...CUSTOMER_TIMELINE.map((step, index) => {
      let state: "done" | "current" | "upcoming" = "upcoming";
      if (currentIndex === -1) {
        state = step === "payment_pending" ? "current" : "upcoming";
      } else if (index < currentIndex) {
        state = "done";
      } else if (index === currentIndex) {
        state = "current";
      }
      const label =
        CUSTOMER_TIMELINE_LABELS[step] ??
        (step === "checked_out" ? "Rental in progress" : customerStatusLabel(step));
      return { id: step, label, state };
    }),
  ];
}

function paymentStatusLabel(status: SafePaymentHistoryItem["status"]) {
  switch (status) {
    case "succeeded":
      return "Succeeded";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return "Pending";
  }
}

export async function loadPublicBooking(
  bookingId: string,
): Promise<PublicBookingView | null> {
  await expireUnpaidBookings();
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const settings = await getSiteSettings();

  const [row] = await db
    .select({
      booking: bookings,
      make: vehicleModels.make,
      model: vehicleModels.model,
      className: vehicleClasses.name,
      pickupLocation: pickupLocations.name,
      returnLocation: returnLocations.name,
      holdExpiresAt: vehicleAllocations.expiresAt,
      holdStatus: vehicleAllocations.status,
    })
    .from(bookings)
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(bookings.vehicleClassId, vehicleClasses.id))
    .innerJoin(pickupLocations, eq(bookings.pickupLocationId, pickupLocations.id))
    .innerJoin(returnLocations, eq(bookings.returnLocationId, returnLocations.id))
    .leftJoin(
      vehicleAllocations,
      eq(bookings.vehicleAllocationId, vehicleAllocations.id),
    )
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    return null;
  }

  const holdActive =
    row.holdStatus === "hold" &&
    Boolean(row.holdExpiresAt && row.holdExpiresAt.getTime() > Date.now());

  const initialPurpose = determineInitialPaymentPurpose({
    pickupAt: row.booking.pickupAt,
    balanceDueHours: settings.balanceDueHours,
  });
  const initialPaymentLabel =
    initialPurpose === "full_rental" ? "Pay rental" : "Pay reservation";

  const history = await listBookingPaymentHistory(bookingId);
  const { getCustomerDepositSummary } = await import("@/lib/operations/security-deposit");
  const depositSummary = await getCustomerDepositSummary(bookingId);

  return {
    reference: row.booking.reference,
    status: row.booking.status,
    statusLabel: customerStatusLabel(row.booking.status),
    pickupLabel: tripLabel(row.booking.pickupAt),
    returnLabel: tripLabel(row.booking.returnAt),
    pickupLocation: row.pickupLocation,
    returnLocation: row.returnLocation,
    durationDays: calculateChargeableDays(row.booking.pickupAt, row.booking.returnAt),
    vehicleLabel: `${row.make} ${row.model}`,
    className: row.className,
    similarDisclosure: MODEL_OR_SIMILAR,
    rentalTotal: row.booking.rentalTotal,
    amountPaid: row.booking.amountPaid,
    reservationPaymentRequired: row.booking.reservationPaymentRequired,
    remainingBalance: row.booking.remainingBalance,
    securityDepositRequired: row.booking.securityDepositRequired,
    securityDepositSummary:
      depositSummary?.label ?? "Refundable security deposit required",
    holdExpiresAt: row.holdExpiresAt,
    holdActive,
    initialPaymentLabel,
    paymentHistory: history.map((item) => ({
      ...item,
      purposeLabel: paymentPurposeLabel(item.purpose),
      statusLabel: paymentStatusLabel(item.status),
    })),
    timeline: timelineFor(row.booking.status),
  };
}

export async function getPublicBookingByReference(reference: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }
  const [row] = await db
    .select({ id: bookings.id, reference: bookings.reference })
    .from(bookings)
    .where(eq(bookings.reference, reference.trim().toUpperCase()))
    .limit(1);
  return row ?? null;
}

export async function getQuoteDetails(quoteId: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      quote: quotes,
      model: vehicleModels,
      vehicleClass: vehicleClasses,
      pickupLocation: pickupLocations,
      returnLocation: returnLocations,
      allocation: vehicleAllocations,
      quoteExpired: sql<boolean>`${quotes.expiresAt} <= now()`,
      holdActive: sql<boolean>`${vehicleAllocations.id} is not null and ${vehicleAllocations.expiresAt} is not null and ${vehicleAllocations.expiresAt} > now()`,
    })
    .from(quotes)
    .innerJoin(vehicleModels, eq(quotes.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(quotes.vehicleClassId, vehicleClasses.id))
    .innerJoin(pickupLocations, eq(quotes.pickupLocationId, pickupLocations.id))
    .innerJoin(returnLocations, eq(quotes.returnLocationId, returnLocations.id))
    .leftJoin(
      vehicleAllocations,
      and(
        eq(vehicleAllocations.quoteId, quotes.id),
        eq(vehicleAllocations.status, "hold"),
      ),
    )
    .where(eq(quotes.id, quoteId))
    .limit(1);

  return row ?? null;
}

export async function getSupportContact() {
  const settings = await getSiteSettings();
  return toPublicContact(settings);
}

export type AdminBookingListFilters = {
  status?: BookingStatus | "";
  pickupDate?: string;
  classId?: string;
  q?: string;
};

export async function listAdminBookings(filters: AdminBookingListFilters) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(bookings.status, filters.status));
  }
  if (filters.classId) {
    conditions.push(eq(bookings.vehicleClassId, filters.classId));
  }
  if (filters.pickupDate) {
    const start = new Date(`${filters.pickupDate}T00:00:00.000Z`);
    const end = new Date(`${filters.pickupDate}T23:59:59.999Z`);
    conditions.push(gte(bookings.pickupAt, start));
    conditions.push(lte(bookings.pickupAt, end));
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(bookings.reference, term),
        ilike(customers.email, term),
        ilike(customers.phone, term),
        ilike(customers.firstName, term),
        ilike(customers.lastName, term),
        sql`(${customers.firstName} || ' ' || ${customers.lastName}) ilike ${term}`,
      ),
    );
  }

  return db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      status: bookings.status,
      pickupAt: bookings.pickupAt,
      returnAt: bookings.returnAt,
      rentalTotal: bookings.rentalTotal,
      amountPaid: bookings.amountPaid,
      remainingBalance: bookings.remainingBalance,
      createdAt: bookings.createdAt,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      make: vehicleModels.make,
      model: vehicleModels.model,
      className: vehicleClasses.name,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(bookings.vehicleClassId, vehicleClasses.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(bookings.createdAt))
    .limit(200);
}

export async function getAdminBooking(id: string) {
  await expireUnpaidBookings();
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      booking: bookings,
      customer: customers,
      quote: quotes,
      model: vehicleModels,
      vehicleClass: vehicleClasses,
      pickupLocation: pickupLocations,
      returnLocation: returnLocations,
      allocation: vehicleAllocations,
      vehicle: vehicles,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(quotes, eq(bookings.quoteId, quotes.id))
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(bookings.vehicleClassId, vehicleClasses.id))
    .innerJoin(pickupLocations, eq(bookings.pickupLocationId, pickupLocations.id))
    .innerJoin(returnLocations, eq(bookings.returnLocationId, returnLocations.id))
    .leftJoin(
      vehicleAllocations,
      eq(bookings.vehicleAllocationId, vehicleAllocations.id),
    )
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const history = await db
    .select()
    .from(bookingStatusHistory)
    .where(eq(bookingStatusHistory.bookingId, id))
    .orderBy(bookingStatusHistory.createdAt);

  return { ...row, history };
}

export function isBookingPrice(value: unknown): value is BookingPrice {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.rentalTotal === "number" &&
    typeof record.reservationPayment === "number" &&
    typeof record.securityDepositRequired === "number"
  );
}
