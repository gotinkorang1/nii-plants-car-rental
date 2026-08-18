import { randomUUID } from "node:crypto";

import { config } from "dotenv";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => {
  let sessionToken: string | null = null;
  return {
    cookies: async () => ({
      get: (name: string) =>
        name === "np_booking_session" && sessionToken
          ? { value: sessionToken }
          : undefined,
      set: (name: string, value: string) => {
        if (name === "np_booking_session" && value) {
          sessionToken = value;
        }
      },
    }),
    __setSessionToken: (token: string | null) => {
      sessionToken = token;
    },
  };
});

import { createBookingFromQuote } from "@/lib/bookings/create-booking";
import { createPaymentAttempt } from "@/lib/payments/create-payment";
import { persistBookingGuestSession } from "@/lib/bookings/guest-session";
import { markMockPaystackSuccess, resetMockPaystackStore } from "@/lib/payments/paystack/mock-store";
import { reconcilePaystackPayment } from "@/lib/payments/reconcile-paystack-payment";
import { checkoutVehicle } from "@/lib/operations/checkout-vehicle";
import { completeInspection } from "@/lib/operations/inspections";
import { completeRental } from "@/lib/operations/complete-rental";
import { markBookingReady } from "@/lib/operations/prepare-booking";
import {
  recordSecurityDepositCollection,
  releaseSecurityDeposit,
  savePickupChecklist,
} from "@/lib/operations/security-deposit";
import { createMaintenanceRecord, cancelMaintenanceRecord } from "@/lib/maintenance/records";
import type { CustomerDetailsValues } from "@/lib/validation/booking";

config({ path: ".env.local" });
config();
process.env.PAYSTACK_MOCK = "1";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Phase 7 operations tests.");
}

describe("phase 7 operations", () => {
  let sql: postgres.Sql;
  const locationId = randomUUID();
  const slug = `p7-${locationId.slice(0, 8)}`;
  const quoteIds: string[] = [];
  const classIds: string[] = [];
  const maintenanceIds: string[] = [];
  const emails: string[] = [];
  let staffAuthId: string = randomUUID();
  let staffId: string = randomUUID();

  async function createStaffProfile(): Promise<string> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRole) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Phase 7 operations tests.",
      );
    }

    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRole}`,
        apikey: serviceRole,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `staff-${slug}@phase7.test`,
        password: "dev-only-not-a-live-password",
        email_confirm: true,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Could not create staff Auth user: ${response.status} ${body}`);
    }
    const created = (await response.json()) as { id?: string };
    if (!created.id) {
      throw new Error("Auth admin user response did not include an id.");
    }
    staffAuthId = created.id;

    const [staff] = await sql<{ id: string }[]>`
      INSERT INTO staff_profiles (auth_user_id, display_name, email, role, active)
      VALUES (
        ${staffAuthId},
        'Phase 7 Staff',
        ${`staff-${slug}@phase7.test`},
        'reservations',
        true
      )
      RETURNING id
    `;
    if (!staff) {
      throw new Error("Could not insert staff_profiles row for Phase 7 tests.");
    }
    return staff.id;
  }

  beforeAll(async () => {
    sql = postgres(databaseUrl, { max: 12 });
    const [{ exists }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'rental_inspections'
      ) AS exists
    `;
    if (!exists) {
      await sql.end({ timeout: 1 });
      throw new Error("rental_inspections is missing. Run `npm run db:migrate`.");
    }
    await sql`
      INSERT INTO locations (id, name, slug, type, active)
      VALUES (${locationId}, ${`Phase 7 ${slug}`}, ${slug}, 'branch', true)
    `;
    staffId = await createStaffProfile();
  });

  beforeEach(() => {
    resetMockPaystackStore();
  });

  afterAll(async () => {
    if (classIds.length > 0) {
      await sql`UPDATE maintenance_records SET vehicle_allocation_id = null WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vehicle_class_id = ANY(${classIds}::uuid[]))`;
    }
    if (maintenanceIds.length > 0) {
      await sql`UPDATE maintenance_records SET vehicle_allocation_id = null WHERE id = ANY(${maintenanceIds}::uuid[])`;
      await sql`DELETE FROM maintenance_records WHERE id = ANY(${maintenanceIds}::uuid[])`;
    }
    if (quoteIds.length > 0) {
      await sql`DELETE FROM inspection_photos WHERE inspection_id IN (SELECT id FROM rental_inspections WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[])))`;
      await sql`DELETE FROM rental_inspections WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM rental_pickup_checklists WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM security_deposits WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM booking_guest_sessions WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM booking_status_history WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`UPDATE bookings SET vehicle_allocation_id = null WHERE quote_id = ANY(${quoteIds}::uuid[])`;
      await sql`DELETE FROM vehicle_allocations WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM vehicle_allocations WHERE quote_id = ANY(${quoteIds}::uuid[])`;
      await sql`DELETE FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[])`;
      await sql`DELETE FROM quotes WHERE id = ANY(${quoteIds}::uuid[])`;
    }
    if (classIds.length > 0) {
      await sql`DELETE FROM maintenance_records WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vehicle_class_id = ANY(${classIds}::uuid[]))`;
      await sql`DELETE FROM vehicle_allocations WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vehicle_class_id = ANY(${classIds}::uuid[]))`;
      await sql`DELETE FROM vehicles WHERE vehicle_class_id = ANY(${classIds}::uuid[])`;
      await sql`DELETE FROM vehicle_models WHERE vehicle_class_id = ANY(${classIds}::uuid[])`;
      await sql`DELETE FROM vehicle_classes WHERE id = ANY(${classIds}::uuid[])`;
    }
    if (emails.length > 0) {
      await sql`DELETE FROM customers WHERE email = ANY(${emails}::text[])`;
    }
    await sql`DELETE FROM staff_profiles WHERE id = ${staffId}`;
    await sql`DELETE FROM auth.users WHERE id = ${staffAuthId}`;
    await sql`DELETE FROM locations WHERE id = ${locationId}`;
    await sql.end({ timeout: 1 });
  });

  async function createFixture(name: string) {
    const classId = randomUUID();
    const modelId = randomUUID();
    const quoteId = randomUUID();
    const vehicleId = randomUUID();
    const vehicleCode = `P7-${name}-${vehicleId.slice(0, 8)}`;
    const classSlug = `${slug}-${name}`;
    classIds.push(classId);
    quoteIds.push(quoteId);
    await sql`
      INSERT INTO vehicle_classes (
        id, name, slug, description, seats, luggage, transmission,
        default_daily_rate, default_security_deposit, active
      )
      VALUES (
        ${classId}, ${`P7 ${classSlug}`}, ${classSlug}, 'Phase 7 fixture',
        4, 2, 'automatic', 35000, 50000, true
      )
    `;
    await sql`
      INSERT INTO vehicle_models (
        id, vehicle_class_id, make, model, slug, description, seats, doors,
        transmission, fuel_type, luggage, air_conditioning, featured, published
      )
      VALUES (
        ${modelId}, ${classId}, 'Phase', ${name}, ${classSlug},
        'Exact model', 4, 4, 'automatic', 'petrol', 2, true, false, true
      )
    `;
    await sql`
      INSERT INTO vehicles (
        id, vehicle_model_id, vehicle_class_id, internal_code, registration_number,
        colour, current_mileage, status, branch_location_id
      )
      VALUES (
        ${vehicleId}, ${modelId}, ${classId}, ${vehicleCode},
        ${`REG-P7-${vehicleId.slice(0, 8)}`}, 'White', 1000, 'available', ${locationId}
      )
    `;
    const pickup = "2031-09-10T10:00:00Z";
    await sql`
      INSERT INTO quotes (
        id, vehicle_model_id, vehicle_class_id, pickup_location_id, return_location_id,
        pickup_at, return_at, chargeable_days, daily_rate, base_rental, extras_total,
        discount_total, rental_total, reservation_payment, remaining_balance,
        security_deposit_required, pricing_snapshot, expires_at
      )
      VALUES (
        ${quoteId}, ${modelId}, ${classId}, ${locationId}, ${locationId},
        ${pickup}, '2031-09-12T10:00:00Z', 2, 35000, 70000, 0,
        0, 100000, 25000, 75000, 50000, ${sql.json({ version: 1 })}::jsonb,
        now() + interval '20 minutes'
      )
    `;
    await sql`
      SELECT allocation_id FROM create_vehicle_hold(
        ${classId}::uuid, ${modelId}::uuid,
        ${pickup}::timestamptz,
        '2031-09-12T10:00:00Z'::timestamptz,
        ${quoteId}::uuid,
        10::integer,
        null::uuid
      )
    `;
    return { classId, modelId, quoteId, vehicleId, pickup };
  }

  function details(quoteId: string, email: string): CustomerDetailsValues {
    emails.push(email);
    return {
      quoteId,
      firstName: "Ama",
      lastName: "Mensah",
      email,
      phone: "0241234567",
      driverAge: 32,
      licenceCountry: "GH",
      licenceNumber: undefined,
    };
  }

  async function authenticateBooking(bookingId: string) {
    const created = await persistBookingGuestSession(bookingId);
    const headers = await import("next/headers");
    (headers as unknown as { __setSessionToken: (token: string | null) => void }).__setSessionToken(
      created.token,
    );
  }

  async function createConfirmedBooking(name: string) {
    const fixture = await createFixture(name);
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `${name}-${slug}@phase7.test`),
    );
    await authenticateBooking(booking.id);
    const payment = await createPaymentAttempt({ bookingId: booking.id });
    markMockPaystackSuccess(payment.providerReference);
    await reconcilePaystackPayment(payment.providerReference, "webhook");
    return { fixture, booking };
  }

  async function preparePickupFlow(bookingId: string) {
    await savePickupChecklist({
      bookingId,
      staffId,
      identityChecked: true,
      licenceChecked: true,
      vehicleConditionChecked: true,
      fuelChecked: true,
      odometerChecked: true,
      customerBriefed: true,
      securityDepositRecorded: true,
    });
    await recordSecurityDepositCollection({
      bookingId,
      staffId,
      collectedAmount: 50000,
      collectionMethod: "cash",
      referenceNote: "Cash at desk",
    });
    await completeInspection({
      bookingId,
      staffId,
      inspectionType: "pickup",
      odometer: 50000,
      fuelLevel: "full",
      generalCondition: "good",
    });
    await markBookingReady({ bookingId, staffId });
  }

  it("runs confirmed → ready → checked_out → completed happy path", async () => {
    const { booking } = await createConfirmedBooking("happy");
    await preparePickupFlow(booking.id);
    await checkoutVehicle({ bookingId: booking.id, staffId });

    const [checkedOut] = await sql<{ status: string }[]>`
      SELECT status FROM bookings WHERE id = ${booking.id}
    `;
    const [allocation] = await sql<{ status: string }[]>`
      SELECT status FROM vehicle_allocations WHERE booking_id = ${booking.id}
    `;
    const [vehicle] = await sql<{ status: string }[]>`
      SELECT status FROM vehicles WHERE id = (SELECT vehicle_id FROM bookings WHERE id = ${booking.id})
    `;
    expect(checkedOut?.status).toBe("checked_out");
    expect(allocation?.status).toBe("checked_out");
    expect(vehicle?.status).toBe("rented");

    await completeInspection({
      bookingId: booking.id,
      staffId,
      inspectionType: "return",
      odometer: 50084,
      fuelLevel: "three_quarters",
      generalCondition: "good",
    });
    await releaseSecurityDeposit({ bookingId: booking.id, staffId });
    await completeRental({ bookingId: booking.id, staffId });

    const [completed] = await sql<{ status: string; amount_paid: number }[]>`
      SELECT status, amount_paid FROM bookings WHERE id = ${booking.id}
    `;
    const [deposit] = await sql<{ status: string }[]>`
      SELECT status FROM security_deposits WHERE booking_id = ${booking.id}
    `;
    expect(completed?.status).toBe("completed");
    expect(completed?.amount_paid).toBe(25000);
    expect(deposit?.status).toBe("released");
  });

  it("rejects checkout without completed pickup inspection", async () => {
    const { booking } = await createConfirmedBooking("no-inspection");
    await markBookingReady({ bookingId: booking.id, staffId });
    await expect(checkoutVehicle({ bookingId: booking.id, staffId })).rejects.toThrow(
      /pickup inspection/i,
    );
  });

  it("rejects return odometer rollback", async () => {
    const { booking } = await createConfirmedBooking("odometer");
    await preparePickupFlow(booking.id);
    await checkoutVehicle({ bookingId: booking.id, staffId });
    await expect(
      completeInspection({
        bookingId: booking.id,
        staffId,
        inspectionType: "return",
        odometer: 49900,
        fuelLevel: "half",
        generalCondition: "good",
      }),
    ).rejects.toThrow(/cannot be lower/i);
  });

  it("keeps security deposit separate from rental payment totals", async () => {
    const { booking } = await createConfirmedBooking("deposit-sep");
    await recordSecurityDepositCollection({
      bookingId: booking.id,
      staffId,
      collectedAmount: 50000,
      collectionMethod: "cash",
    });
    const [row] = await sql<{ amount_paid: number; remaining_balance: number }[]>`
      SELECT amount_paid, remaining_balance FROM bookings WHERE id = ${booking.id}
    `;
    expect(row?.amount_paid).toBe(25000);
    expect(row?.remaining_balance).toBe(75000);
  });

  it("completes damaged return with maintenance vehicle state", async () => {
    const { booking } = await createConfirmedBooking("damage");
    await preparePickupFlow(booking.id);
    await checkoutVehicle({ bookingId: booking.id, staffId });
    await completeInspection({
      bookingId: booking.id,
      staffId,
      inspectionType: "return",
      odometer: 50100,
      fuelLevel: "half",
      generalCondition: "damage_detected",
      damageSummary: "Rear bumper scratch",
      maintenanceRequired: true,
    });
    await completeRental({ bookingId: booking.id, staffId });

    const [vehicle] = await sql<{ status: string }[]>`
      SELECT status FROM vehicles WHERE id = (SELECT vehicle_id FROM bookings WHERE id = ${booking.id})
    `;
    const [{ count: maintenanceCount }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM maintenance_records
      WHERE vehicle_id = (SELECT vehicle_id FROM bookings WHERE id = ${booking.id})
    `;
    expect(vehicle?.status).toBe("maintenance");
    expect(Number(maintenanceCount)).toBeGreaterThan(0);
  });

  it("blocks maintenance overlapping confirmed rental", async () => {
    const { fixture } = await createConfirmedBooking("maint-conflict");
    await expect(
      createMaintenanceRecord({
        vehicleId: fixture.vehicleId,
        maintenanceType: "repair",
        title: "Overlap test",
        startAt: new Date("2031-09-10T09:00:00Z"),
        endAt: new Date("2031-09-11T09:00:00Z"),
        staffId,
      }),
    ).rejects.toThrow(/conflicts/i);
  });

  it("maintenance block prevents allocation then clears after cancel", async () => {
    const fixture = await createFixture("maint-block");
    const vehicleId = fixture.vehicleId;
    const record = await createMaintenanceRecord({
      vehicleId,
      maintenanceType: "scheduled_service",
      title: "Service window",
      startAt: new Date("2031-10-01T08:00:00Z"),
      endAt: new Date("2031-10-03T18:00:00Z"),
      staffId,
    });
    maintenanceIds.push(record!.id);

    const [{ count: blocked }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM vehicle_allocations
      WHERE vehicle_id = ${vehicleId}
        AND allocation_type = 'maintenance'
        AND status = 'confirmed'
    `;
    expect(Number(blocked)).toBe(1);

    await cancelMaintenanceRecord({ maintenanceId: record!.id, staffId });

    const [{ count: active }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM vehicle_allocations
      WHERE vehicle_id = ${vehicleId}
        AND allocation_type = 'maintenance'
        AND status = 'confirmed'
    `;
    expect(Number(active)).toBe(0);
  });

  it("checkout is idempotent under concurrent requests", async () => {
    const { booking } = await createConfirmedBooking("dup-checkout");
    await preparePickupFlow(booking.id);
    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => checkoutVehicle({ bookingId: booking.id, staffId })),
    );
    const fulfilled = results.filter((item) => item.status === "fulfilled").length;
    expect(fulfilled).toBeGreaterThanOrEqual(1);
    const [{ count }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM booking_status_history
      WHERE booking_id = ${booking.id} AND to_status = 'checked_out'
    `;
    expect(Number(count)).toBe(1);
  });

  it("completion is idempotent under concurrent requests", async () => {
    const { booking } = await createConfirmedBooking("dup-complete");
    await preparePickupFlow(booking.id);
    await checkoutVehicle({ bookingId: booking.id, staffId });
    await completeInspection({
      bookingId: booking.id,
      staffId,
      inspectionType: "return",
      odometer: 50100,
      fuelLevel: "full",
      generalCondition: "good",
    });
    await releaseSecurityDeposit({ bookingId: booking.id, staffId });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () => completeRental({ bookingId: booking.id, staffId })),
    );
    const fulfilled = results.filter((item) => item.status === "fulfilled").length;
    expect(fulfilled).toBeGreaterThanOrEqual(1);
    const [{ count }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM booking_status_history
      WHERE booking_id = ${booking.id} AND to_status = 'completed'
    `;
    expect(Number(count)).toBe(1);
  });

  it("derives vehicle assignment from booking during inspection", async () => {
    const { booking, fixture } = await createConfirmedBooking("vehicle-assign");
    await preparePickupFlow(booking.id);

    const [inspection] = await sql<{ vehicle_id: string }[]>`
      SELECT vehicle_id FROM rental_inspections
      WHERE booking_id = ${booking.id} AND inspection_type = 'pickup'
    `;
    expect(inspection?.vehicle_id).toBe(fixture.vehicleId);
  });

  it("keeps inspection-media bucket private", async () => {
    const [bucket] = await sql<{ public: boolean }[]>`
      SELECT public FROM storage.buckets WHERE id = 'inspection-media'
    `;
    expect(bucket?.public).toBe(false);
  });
});
