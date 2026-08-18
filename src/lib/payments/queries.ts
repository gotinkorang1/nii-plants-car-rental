import "server-only";

import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { bookings, customers, payments } from "@/lib/db/schema";
import type { PaymentPurpose, PaymentStatus } from "@/lib/payments/types";

export type AdminPaymentListFilters = {
  status?: PaymentStatus | "";
  purpose?: PaymentPurpose | "";
  reviewRequired?: boolean;
  date?: string;
  q?: string;
};

export async function listAdminPayments(filters: AdminPaymentListFilters) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const conditions = [];
  if (filters.status) {
    conditions.push(eq(payments.status, filters.status));
  }
  if (filters.purpose) {
    conditions.push(eq(payments.purpose, filters.purpose));
  }
  if (filters.reviewRequired) {
    conditions.push(eq(payments.reviewRequired, true));
  }
  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(`${filters.date}T23:59:59.999Z`);
    conditions.push(gte(payments.createdAt, start));
    conditions.push(lte(payments.createdAt, end));
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(payments.providerReference, term),
        ilike(bookings.reference, term),
        ilike(customers.email, term),
        ilike(customers.firstName, term),
        ilike(customers.lastName, term),
      ),
    );
  }

  return db
    .select({
      id: payments.id,
      providerReference: payments.providerReference,
      purpose: payments.purpose,
      amount: payments.amount,
      status: payments.status,
      reviewRequired: payments.reviewRequired,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      bookingReference: bookings.reference,
      bookingId: bookings.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(payments.createdAt))
    .limit(200);
}

export async function getAdminPayment(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      payment: payments,
      booking: bookings,
      customer: customers,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .where(eq(payments.id, id))
    .limit(1);

  return row ?? null;
}
