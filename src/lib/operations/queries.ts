import "server-only";

import { and, eq, gte, inArray, lte, or, sql } from "drizzle-orm";

import { utcToAccraDateInput } from "@/lib/booking/timezone";
import type { maintenanceStatusEnum } from "@/lib/db/schema/enums";
import { tryGetDb } from "@/lib/db";
import {
  bookings,
  customers,
  inspectionPhotos,
  maintenanceRecords,
  rentalInspections,
  rentalPickupChecklists,
  securityDeposits,
  vehicleClasses,
  vehicleModels,
  vehicles,
} from "@/lib/db/schema";
import { getInspectionPhotoSignedUrl } from "@/lib/operations/inspection-storage";

function accraDayBounds(reference = new Date()) {
  const date = utcToAccraDateInput(reference);
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  return { start, end, date };
}

export async function getOperationsDashboard() {
  const db = tryGetDb();
  if (!db) {
    return {
      todayPickups: 0,
      todayReturns: 0,
      vehiclesRented: 0,
      vehiclesMaintenance: 0,
      attentionCount: 0,
      outstandingBalanceCount: 0,
      pickups: [] as Array<Record<string, unknown>>,
      returns: [] as Array<Record<string, unknown>>,
    };
  }

  const { start, end } = accraDayBounds();

  const [pickups, returns, rented, maintenance, attention, balances] = await Promise.all([
    db
      .select({
        id: bookings.id,
        reference: bookings.reference,
        status: bookings.status,
        pickupAt: bookings.pickupAt,
        remainingBalance: bookings.remainingBalance,
        amountPaid: bookings.amountPaid,
        firstName: customers.firstName,
        lastName: customers.lastName,
        make: vehicleModels.make,
        model: vehicleModels.model,
        registration: vehicles.registrationNumber,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(
        and(
          gte(bookings.pickupAt, start),
          lte(bookings.pickupAt, end),
          inArray(bookings.status, ["confirmed", "ready"]),
        ),
      )
      .orderBy(bookings.pickupAt)
      .limit(20),
    db
      .select({
        id: bookings.id,
        reference: bookings.reference,
        status: bookings.status,
        returnAt: bookings.returnAt,
        firstName: customers.firstName,
        lastName: customers.lastName,
        make: vehicleModels.make,
        model: vehicleModels.model,
        registration: vehicles.registrationNumber,
        overdue: sql<boolean>`${bookings.returnAt} < now()`,
      })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(and(eq(bookings.status, "checked_out"), lte(bookings.returnAt, end)))
      .orderBy(bookings.returnAt)
      .limit(20),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(eq(vehicles.status, "rented")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(vehicles)
      .where(eq(vehicles.status, "maintenance")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(
        or(
          eq(bookings.status, "under_review"),
          and(eq(bookings.status, "payment_pending"), sql`${bookings.pickupAt} < now()`),
        ),
      ),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookings)
      .where(and(sql`${bookings.remainingBalance} > 0`, inArray(bookings.status, ["confirmed", "ready", "checked_out"]))),
  ]);

  return {
    todayPickups: pickups.length,
    todayReturns: returns.length,
    vehiclesRented: rented[0]?.count ?? 0,
    vehiclesMaintenance: maintenance[0]?.count ?? 0,
    attentionCount: attention[0]?.count ?? 0,
    outstandingBalanceCount: balances[0]?.count ?? 0,
    pickups,
    returns,
  };
}

export async function getOperationalBookingContext(bookingId: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      booking: bookings,
      customer: customers,
      model: vehicleModels,
      vehicleClass: vehicleClasses,
      vehicle: vehicles,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .innerJoin(vehicleClasses, eq(bookings.vehicleClassId, vehicleClasses.id))
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    return null;
  }

  const inspections = await db
    .select()
    .from(rentalInspections)
    .where(eq(rentalInspections.bookingId, bookingId));

  const [checklist] = await db
    .select()
    .from(rentalPickupChecklists)
    .where(eq(rentalPickupChecklists.bookingId, bookingId))
    .limit(1);

  const [deposit] = await db
    .select()
    .from(securityDeposits)
    .where(eq(securityDeposits.bookingId, bookingId))
    .limit(1);

  const pickup = inspections.find((item) => item.inspectionType === "pickup") ?? null;
  const returnInspection = inspections.find((item) => item.inspectionType === "return") ?? null;

  return {
    ...row,
    pickupInspection: pickup,
    returnInspection,
    checklist: checklist ?? null,
    deposit: deposit ?? null,
    distanceKm:
      pickup?.odometer !== null &&
      pickup?.odometer !== undefined &&
      returnInspection?.odometer !== null &&
      returnInspection?.odometer !== undefined
        ? returnInspection.odometer - pickup.odometer
        : null,
    overdueReturn: row.booking.status === "checked_out" && row.booking.returnAt.getTime() < Date.now(),
  };
}

export async function listInspectionPhotos(inspectionId: string) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const rows = await db
    .select()
    .from(inspectionPhotos)
    .where(eq(inspectionPhotos.inspectionId, inspectionId))
    .orderBy(inspectionPhotos.sortOrder, inspectionPhotos.createdAt);

  return Promise.all(
    rows.map(async (photo) => ({
      ...photo,
      signedUrl: await getInspectionPhotoSignedUrl(photo.storagePath),
    })),
  );
}

export async function listMaintenanceRecords(input?: {
  status?: string;
  vehicleId?: string;
}) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  const conditions = [];
  if (input?.status) {
    conditions.push(
      eq(
        maintenanceRecords.status,
        input.status as (typeof maintenanceStatusEnum.enumValues)[number],
      ),
    );
  }
  if (input?.vehicleId) {
    conditions.push(eq(maintenanceRecords.vehicleId, input.vehicleId));
  }

  return db
    .select({
      id: maintenanceRecords.id,
      title: maintenanceRecords.title,
      maintenanceType: maintenanceRecords.maintenanceType,
      status: maintenanceRecords.status,
      startAt: maintenanceRecords.startAt,
      endAt: maintenanceRecords.endAt,
      vehicleId: maintenanceRecords.vehicleId,
      internalCode: vehicles.internalCode,
      registration: vehicles.registrationNumber,
      make: vehicleModels.make,
      model: vehicleModels.model,
    })
    .from(maintenanceRecords)
    .innerJoin(vehicles, eq(maintenanceRecords.vehicleId, vehicles.id))
    .innerJoin(vehicleModels, eq(vehicles.vehicleModelId, vehicleModels.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(maintenanceRecords.startAt)
    .limit(100);
}

export async function getMaintenanceRecord(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      record: maintenanceRecords,
      internalCode: vehicles.internalCode,
      registration: vehicles.registrationNumber,
      make: vehicleModels.make,
      model: vehicleModels.model,
    })
    .from(maintenanceRecords)
    .innerJoin(vehicles, eq(maintenanceRecords.vehicleId, vehicles.id))
    .innerJoin(vehicleModels, eq(vehicles.vehicleModelId, vehicleModels.id))
    .where(eq(maintenanceRecords.id, id))
    .limit(1);

  return row ?? null;
}

export async function getVehicleOperationalHistory(vehicleId: string) {
  const db = tryGetDb();
  if (!db) {
    return {
      maintenance: [],
      inspections: [],
      rentals: [],
    };
  }

  const [maintenance, inspections, rentals] = await Promise.all([
    db
      .select({
        id: maintenanceRecords.id,
        title: maintenanceRecords.title,
        maintenanceType: maintenanceRecords.maintenanceType,
        status: maintenanceRecords.status,
        startAt: maintenanceRecords.startAt,
        endAt: maintenanceRecords.endAt,
      })
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.vehicleId, vehicleId))
      .orderBy(sql`${maintenanceRecords.startAt} DESC`)
      .limit(10),
    db
      .select({
        id: rentalInspections.id,
        inspectionType: rentalInspections.inspectionType,
        odometer: rentalInspections.odometer,
        fuelLevel: rentalInspections.fuelLevel,
        generalCondition: rentalInspections.generalCondition,
        completedAt: rentalInspections.completedAt,
        bookingReference: bookings.reference,
        photoCount: sql<number>`(
          SELECT count(*)::int FROM inspection_photos
          WHERE inspection_id = ${rentalInspections.id}
        )`,
      })
      .from(rentalInspections)
      .innerJoin(bookings, eq(rentalInspections.bookingId, bookings.id))
      .where(
        and(
          eq(rentalInspections.vehicleId, vehicleId),
          sql`${rentalInspections.completedAt} IS NOT NULL`,
        ),
      )
      .orderBy(sql`${rentalInspections.completedAt} DESC`)
      .limit(10),
    db
      .select({
        id: bookings.id,
        reference: bookings.reference,
        status: bookings.status,
        pickupAt: bookings.pickupAt,
        returnAt: bookings.returnAt,
        checkedOutAt: bookings.checkedOutAt,
        completedAt: bookings.completedAt,
      })
      .from(bookings)
      .where(eq(bookings.vehicleId, vehicleId))
      .orderBy(
        sql`coalesce(${bookings.completedAt}, ${bookings.checkedOutAt}, ${bookings.pickupAt}) DESC`,
      )
      .limit(10),
  ]);

  return { maintenance, inspections, rentals };
}

export async function listActiveRentals() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      status: bookings.status,
      pickupAt: bookings.pickupAt,
      returnAt: bookings.returnAt,
      checkedOutAt: bookings.checkedOutAt,
      firstName: customers.firstName,
      lastName: customers.lastName,
      make: vehicleModels.make,
      model: vehicleModels.model,
      registration: vehicles.registrationNumber,
      internalCode: vehicles.internalCode,
      overdue: sql<boolean>`${bookings.returnAt} < now()`,
    })
    .from(bookings)
    .innerJoin(customers, eq(bookings.customerId, customers.id))
    .innerJoin(vehicleModels, eq(bookings.vehicleModelId, vehicleModels.id))
    .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
    .where(inArray(bookings.status, ["checked_out"]))
    .orderBy(bookings.returnAt)
    .limit(100);
}
