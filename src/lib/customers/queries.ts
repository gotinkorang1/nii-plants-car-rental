import "server-only";

import { desc, eq, ilike, or, sql } from "drizzle-orm";

import type { BookingStatus } from "@/lib/bookings/status";
import { tryGetDb } from "@/lib/db";
import {
  bookings,
  customers,
  vehicleClasses,
  vehicleModels,
} from "@/lib/db/schema";
import { summarizeCustomerHires } from "@/lib/customers/summarize";

export type AdminCustomerListRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  guest: boolean;
  bookingCount: number;
  lastPickupAt: Date | null;
  lastStatus: BookingStatus | null;
  lastReference: string | null;
  outstandingBalance: number;
};

export type AdminCustomerHire = {
  id: string;
  reference: string;
  status: BookingStatus;
  pickupAt: Date;
  returnAt: Date;
  rentalTotal: number;
  amountPaid: number;
  remainingBalance: number;
  driverAge: number;
  licenceCountry: string;
  licenceNumber: string | null;
  make: string;
  model: string;
  className: string;
  createdAt: Date;
};

export type AdminCustomerDetail = {
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    guest: boolean;
    createdAt: Date;
  };
  hires: AdminCustomerHire[];
  summary: ReturnType<typeof summarizeCustomerHires>;
};

function searchCondition(q?: string) {
  const trimmed = q?.trim();
  if (!trimmed) {
    return undefined;
  }

  const term = `%${trimmed}%`;
  return or(
    ilike(customers.email, term),
    ilike(customers.phone, term),
    ilike(customers.firstName, term),
    ilike(customers.lastName, term),
    sql`(${customers.firstName} || ' ' || ${customers.lastName}) ilike ${term}`,
    sql`exists (
      select 1 from ${bookings}
      where ${bookings.customerId} = ${customers.id}
      and ${bookings.reference} ilike ${term}
    )`,
  );
}

export async function listAdminCustomers(q?: string): Promise<AdminCustomerListRow[]> {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const condition = searchCondition(q);

  const rows = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      authUserId: customers.authUserId,
      bookingCount: sql<number>`(
        select count(*)::int from ${bookings}
        where ${bookings.customerId} = ${customers.id}
      )`,
      lastPickupAt: sql<Date | null>`(
        select max(${bookings.pickupAt}) from ${bookings}
        where ${bookings.customerId} = ${customers.id}
      )`,
      lastStatus: sql<BookingStatus | null>`(
        select ${bookings.status} from ${bookings}
        where ${bookings.customerId} = ${customers.id}
        order by ${bookings.createdAt} desc
        limit 1
      )`,
      lastReference: sql<string | null>`(
        select ${bookings.reference} from ${bookings}
        where ${bookings.customerId} = ${customers.id}
        order by ${bookings.createdAt} desc
        limit 1
      )`,
      outstandingBalance: sql<number>`(
        select coalesce(sum(${bookings.remainingBalance}), 0)::int
        from ${bookings}
        where ${bookings.customerId} = ${customers.id}
        and ${bookings.status} not in ('cancelled', 'expired', 'rejected')
      )`,
    })
    .from(customers)
    .where(condition)
    .orderBy(
      sql`(
        select max(${bookings.createdAt}) from ${bookings}
        where ${bookings.customerId} = ${customers.id}
      ) desc nulls last`,
      desc(customers.createdAt),
    )
    .limit(200);

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    guest: row.authUserId == null,
    bookingCount: Number(row.bookingCount),
    lastPickupAt: row.lastPickupAt,
    lastStatus: row.lastStatus,
    lastReference: row.lastReference,
    outstandingBalance: Number(row.outstandingBalance),
  }));
}

export async function getAdminCustomer(id: string): Promise<AdminCustomerDetail | null> {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [customer] = await db
    .select({
      id: customers.id,
      firstName: customers.firstName,
      lastName: customers.lastName,
      email: customers.email,
      phone: customers.phone,
      authUserId: customers.authUserId,
      createdAt: customers.createdAt,
    })
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) {
    return null;
  }

  const hires = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      status: bookings.status,
      pickupAt: bookings.pickupAt,
      returnAt: bookings.returnAt,
      rentalTotal: bookings.rentalTotal,
      amountPaid: bookings.amountPaid,
      remainingBalance: bookings.remainingBalance,
      driverAge: bookings.driverAge,
      licenceCountry: bookings.licenceCountry,
      licenceNumber: bookings.licenceNumber,
      createdAt: bookings.createdAt,
      make: vehicleModels.make,
      model: vehicleModels.model,
      className: vehicleClasses.name,
    })
    .from(bookings)
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(bookings.vehicleClassId, vehicleClasses.id))
    .where(eq(bookings.customerId, customer.id))
    .orderBy(desc(bookings.createdAt));

  return {
    customer: {
      id: customer.id,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      guest: customer.authUserId == null,
      createdAt: customer.createdAt,
    },
    hires,
    summary: summarizeCustomerHires(hires),
  };
}
