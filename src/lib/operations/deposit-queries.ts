import "server-only";

import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  bookings,
  customers,
  securityDeposits,
  vehicleModels,
} from "@/lib/db/schema";
import {
  parseSecurityDepositStatus,
  type SecurityDepositStatus,
} from "@/lib/operations/deposit-status";

export type AdminDepositListFilters = {
  status?: SecurityDepositStatus | "";
  q?: string;
};

export async function listAdminSecurityDeposits(filters: AdminDepositListFilters) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const status = parseSecurityDepositStatus(filters.status);
  const conditions = [];
  if (status) {
    conditions.push(eq(securityDeposits.status, status));
  }
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      or(
        ilike(bookings.reference, term),
        ilike(customers.email, term),
        ilike(customers.firstName, term),
        ilike(customers.lastName, term),
        sql`(${customers.firstName} || ' ' || ${customers.lastName}) ilike ${term}`,
      ),
    );
  }

  return db
    .select({
      id: securityDeposits.id,
      status: securityDeposits.status,
      requiredAmount: securityDeposits.requiredAmount,
      collectedAmount: securityDeposits.collectedAmount,
      collectionMethod: securityDeposits.collectionMethod,
      collectedAt: securityDeposits.collectedAt,
      releasedAt: securityDeposits.releasedAt,
      bookingId: bookings.id,
      bookingReference: bookings.reference,
      pickupAt: bookings.pickupAt,
      returnAt: bookings.returnAt,
      bookingStatus: bookings.status,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      make: vehicleModels.make,
      model: vehicleModels.model,
    })
    .from(securityDeposits)
    .innerJoin(bookings, eq(securityDeposits.bookingId, bookings.id))
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(securityDeposits.updatedAt))
    .limit(200);
}

export async function getAdminSecurityDeposit(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      deposit: securityDeposits,
      booking: bookings,
      customer: customers,
      model: vehicleModels,
    })
    .from(securityDeposits)
    .innerJoin(bookings, eq(securityDeposits.bookingId, bookings.id))
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .where(eq(securityDeposits.id, id))
    .limit(1);

  return row ?? null;
}
