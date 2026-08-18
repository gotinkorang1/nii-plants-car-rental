import { randomUUID } from "node:crypto";

import { config } from "dotenv";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () => undefined,
    set: () => undefined,
  }),
}));

import { cancelUnpaidBooking } from "@/lib/bookings/cancel-booking";
import { HOLD_EXPIRED_MESSAGE } from "@/lib/bookings/constants";
import { createBookingFromQuote } from "@/lib/bookings/create-booking";
import { expireUnpaidBookings } from "@/lib/bookings/expire-unpaid-bookings";
import {
  findActiveGuestSession,
  persistBookingGuestSession,
  revokeBookingGuestSessions,
} from "@/lib/bookings/guest-session";
import { requestBookingAccessOtp, verifyBookingAccessOtp } from "@/lib/bookings/otp";
import { listAdminBookings } from "@/lib/bookings/queries";
import { hashSessionToken } from "@/lib/bookings/secrets";
import { latestDevOtp } from "@/lib/email/dev-outbox";
import type { CustomerDetailsValues } from "@/lib/validation/booking";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Phase 5 booking tests. Configure .env.local and run `npm run db:migrate`.",
  );
}

type Fixture = {
  classId: string;
  modelId: string;
  quoteId: string;
  vehicleId: string;
  locationId: string;
};

describe("phase 5 bookings", () => {
  let sql: postgres.Sql;
  const locationId = randomUUID();
  const slug = `p5-${locationId.slice(0, 8)}`;
  const fixtures: Fixture[] = [];
  const emails: string[] = [];

  beforeAll(async () => {
    sql = postgres(databaseUrl, { max: 12 });
    const [{ exists }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'bookings'
      ) AS exists
    `;
    if (!exists) {
      await sql.end({ timeout: 1 });
      throw new Error("bookings table is missing. Run `npm run db:migrate`.");
    }
    await sql`
      INSERT INTO locations (id, name, slug, type, active)
      VALUES (${locationId}, ${`Phase 5 ${slug}`}, ${slug}, 'branch', true)
    `;
  });

  afterAll(async () => {
    const quoteIds = fixtures.map((item) => item.quoteId);
    const classIds = fixtures.map((item) => item.classId);
    if (quoteIds.length > 0) {
      await sql`DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM booking_access_codes WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM booking_guest_sessions WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`DELETE FROM booking_status_history WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
      await sql`UPDATE bookings SET vehicle_allocation_id = null WHERE quote_id = ANY(${quoteIds}::uuid[])`;
      await sql`DELETE FROM vehicle_allocations WHERE quote_id = ANY(${quoteIds}::uuid[])`;
      await sql`DELETE FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[])`;
      await sql`DELETE FROM quotes WHERE id = ANY(${quoteIds}::uuid[])`;
    }
    if (classIds.length > 0) {
      await sql`DELETE FROM vehicles WHERE vehicle_class_id = ANY(${classIds}::uuid[])`;
      await sql`DELETE FROM vehicle_models WHERE vehicle_class_id = ANY(${classIds}::uuid[])`;
      await sql`DELETE FROM vehicle_classes WHERE id = ANY(${classIds}::uuid[])`;
    }
    if (emails.length > 0) {
      await sql`DELETE FROM customers WHERE email = ANY(${emails}::text[])`;
    }
    await sql`DELETE FROM locations WHERE id = ${locationId}`;
    await sql.end({ timeout: 1 });
  });

  async function createFixture(name: string): Promise<Fixture> {
    const classId = randomUUID();
    const modelId = randomUUID();
    const quoteId = randomUUID();
    const vehicleId = randomUUID();
    const classSlug = `${slug}-${name}`;
    await sql`
      INSERT INTO vehicle_classes (
        id, name, slug, description, seats, luggage, transmission,
        default_daily_rate, default_security_deposit, active
      )
      VALUES (
        ${classId}, ${`P5 ${classSlug}`}, ${classSlug}, 'Phase 5 fixture',
        4, 2, 'automatic', 35000, 150000, true
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
        ${vehicleId}, ${modelId}, ${classId}, ${`P5-${name}`},
        ${`REG-P5-${name}`}, 'White', 1000, 'available', ${locationId}
      )
    `;
    await sql`
      INSERT INTO quotes (
        id, vehicle_model_id, vehicle_class_id, pickup_location_id, return_location_id,
        pickup_at, return_at, chargeable_days, daily_rate, base_rental, extras_total,
        discount_total, rental_total, reservation_payment, remaining_balance,
        security_deposit_required, pricing_snapshot, expires_at
      )
      VALUES (
        ${quoteId}, ${modelId}, ${classId}, ${locationId}, ${locationId},
        '2031-08-10T10:00:00Z', '2031-08-12T10:00:00Z', 2, 35000, 70000, 0,
        0, 70000, 17500, 52500, 150000, ${sql.json({ version: 1, rentalTotal: 70000, reservationPayment: 17500, remainingBalance: 52500, securityDepositRequired: 150000 })}::jsonb,
        now() + interval '20 minutes'
      )
    `;
    await sql`
      SELECT allocation_id FROM create_vehicle_hold(
        ${classId}::uuid, ${modelId}::uuid,
        '2031-08-10T10:00:00Z'::timestamptz,
        '2031-08-12T10:00:00Z'::timestamptz,
        ${quoteId}::uuid, 15, null
      )
    `;
    const fixture = { classId, modelId, quoteId, vehicleId, locationId };
    fixtures.push(fixture);
    return fixture;
  }

  function details(quoteId: string, email: string): CustomerDetailsValues {
    emails.push(email.trim().toLowerCase());
    return {
      quoteId,
      firstName: "Ama",
      lastName: "Mensah",
      email,
      phone: "0241234567",
      driverAge: 32,
      licenceCountry: "GHANA",
      licenceNumber: undefined,
    };
  }

  it("creates one payment_pending booking from a quote and keep the hold", async () => {
    const fixture = await createFixture("create");
    const email = `create-${slug}@phase5.test`;
    const booking = await createBookingFromQuote(details(fixture.quoteId, email));
    expect(booking.status).toBe("payment_pending");
    expect(booking.amountPaid).toBe(0);
    expect(booking.rentalTotal).toBe(70000);
    expect(booking.reservationPaymentRequired).toBe(17500);
    expect(booking.remainingBalance).toBe(52500);
    expect(booking.securityDepositRequired).toBe(150000);
    expect(booking.confirmedAt).toBeNull();

    const [allocation] = await sql<{ status: string; booking_id: string | null }[]>`
      SELECT status, booking_id FROM vehicle_allocations WHERE quote_id = ${fixture.quoteId}
    `;
    expect(allocation?.status).toBe("hold");
    expect(allocation?.booking_id).toBe(booking.id);

    const [count] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM bookings WHERE quote_id = ${fixture.quoteId}
    `;
    expect(count?.count).toBe(1);
  });

  it("is idempotent under concurrent duplicate submissions", async () => {
    const fixture = await createFixture("dup");
    const email = `dup-${slug}@phase5.test`;
    const payload = details(fixture.quoteId, email);
    const results = await Promise.allSettled([
      createBookingFromQuote(payload),
      createBookingFromQuote(payload),
    ]);
    const fulfilled = results.filter((item) => item.status === "fulfilled");
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    const [count] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM bookings WHERE quote_id = ${fixture.quoteId}
    `;
    expect(count?.count).toBe(1);
  });

  it("rejects booking creation after the hold expires", async () => {
    const fixture = await createFixture("hold-exp");
    await sql`
      UPDATE vehicle_allocations
      SET expires_at = now() - interval '2 minutes'
      WHERE quote_id = ${fixture.quoteId}
    `;
    await expect(
      createBookingFromQuote(details(fixture.quoteId, `hold-${slug}@phase5.test`)),
    ).rejects.toMatchObject({
      message: HOLD_EXPIRED_MESSAGE,
    });
    const [count] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM bookings WHERE quote_id = ${fixture.quoteId}
    `;
    expect(count?.count).toBe(0);
  });

  it("rejects booking creation after the quote expires", async () => {
    const fixture = await createFixture("quote-exp");
    await sql`
      UPDATE quotes SET expires_at = now() - interval '2 minutes' WHERE id = ${fixture.quoteId}
    `;
    await expect(
      createBookingFromQuote(details(fixture.quoteId, `quote-${slug}@phase5.test`)),
    ).rejects.toThrow(/expired/i);
    const [count] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM bookings WHERE quote_id = ${fixture.quoteId}
    `;
    expect(count?.count).toBe(0);
  });

  it("ignores client price tampering and copies quote money", async () => {
    const fixture = await createFixture("tamper");
    const booking = await createBookingFromQuote({
      ...details(fixture.quoteId, `tamper-${slug}@phase5.test`),
      rentalTotal: 1,
      vehicleId: randomUUID(),
      securityDeposit: 1,
    } as CustomerDetailsValues);
    expect(booking.rentalTotal).toBe(70000);
    expect(booking.securityDepositRequired).toBe(150000);
    expect(booking.vehicleModelId).toBe(fixture.modelId);
  });

  it("reuses a customer by normalised email without sharing guest sessions", async () => {
    const first = await createFixture("reuse-a");
    const second = await createFixture("reuse-b");
    const email = `reuse-${slug}@phase5.test`;
    const bookingA = await createBookingFromQuote(details(first.quoteId, email));
    const bookingB = await createBookingFromQuote(
      details(second.quoteId, `  ${email.toUpperCase()}  `),
    );
    expect(bookingA.customerId).toBe(bookingB.customerId);
    const sessionA = await persistBookingGuestSession(bookingA.id);
    const sessionB = await persistBookingGuestSession(bookingB.id);
    const loadedA = await findActiveGuestSession(hashSessionToken(sessionA.token));
    expect(loadedA?.bookingId).toBe(bookingA.id);
    expect(loadedA?.bookingId).not.toBe(bookingB.id);
    expect(sessionA.token).not.toBe(sessionB.token);
  });

  it("keeps payment_pending bookings after the hold ends so late payment can still be processed", async () => {
    const fixture = await createFixture("expire");
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `expire-${slug}@phase5.test`),
    );
    await sql`
      UPDATE vehicle_allocations
      SET expires_at = now() - interval '2 minutes', status = 'expired'
      WHERE booking_id = ${booking.id}
    `;
    const expiredCount = await expireUnpaidBookings();
    expect(expiredCount).toBe(0);
    const [row] = await sql<{ status: string; expired_at: Date | null }[]>`
      SELECT status, expired_at FROM bookings WHERE id = ${booking.id}
    `;
    expect(row?.status).toBe("payment_pending");
    expect(row?.expired_at).toBeNull();
  });

  it("cancels an unpaid booking and releases the hold", async () => {
    const fixture = await createFixture("cancel");
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `cancel-${slug}@phase5.test`),
    );
    await cancelUnpaidBooking({
      bookingId: booking.id,
      reason: "Customer changed dates",
      staffId: randomUUID(),
    });
    const [row] = await sql<{ status: string }[]>`
      SELECT status FROM bookings WHERE id = ${booking.id}
    `;
    expect(row?.status).toBe("cancelled");
    const [allocation] = await sql<{ status: string }[]>`
      SELECT status FROM vehicle_allocations WHERE booking_id = ${booking.id}
    `;
    expect(allocation?.status).toBe("cancelled");
  });

  it("requires OTP, rejects replay, expiry, brute force, and scoped sessions", async () => {
    const fixtureA = await createFixture("otp-a");
    const fixtureB = await createFixture("otp-b");
    const emailA = `otp-a-${slug}@phase5.test`;
    const emailB = `otp-b-${slug}@phase5.test`;
    const bookingA = await createBookingFromQuote(details(fixtureA.quoteId, emailA));
    const bookingB = await createBookingFromQuote(details(fixtureB.quoteId, emailB));

    const generic = await requestBookingAccessOtp({
      reference: bookingA.reference,
      email: "wrong@example.com",
    });
    expect(generic.message).toMatch(/if the booking details match/i);
    expect(await latestDevOtp({ email: "wrong@example.com", reference: bookingA.reference })).toBeNull();

    const requested = await requestBookingAccessOtp({
      reference: bookingA.reference,
      email: emailA,
    });
    expect(requested.ok).toBe(true);
    const code = await latestDevOtp({ email: emailA, reference: bookingA.reference });
    expect(code).toMatch(/^\d{6}$/);

    await verifyBookingAccessOtp({
      reference: bookingA.reference,
      email: emailA,
      code: code as string,
    });
    await expect(
      verifyBookingAccessOtp({
        reference: bookingA.reference,
        email: emailA,
        code: code as string,
      }),
    ).rejects.toThrow();

    await requestBookingAccessOtp({
      reference: bookingB.reference,
      email: emailB,
    });
    const codeB = await latestDevOtp({ email: emailB, reference: bookingB.reference });
    await sql`
      UPDATE booking_access_codes
      SET expires_at = now() - interval '1 minute'
      WHERE booking_id = ${bookingB.id} AND used_at IS NULL
    `;
    await expect(
      verifyBookingAccessOtp({
        reference: bookingB.reference,
        email: emailB,
        code: codeB as string,
      }),
    ).rejects.toThrow();

    const fixtureC = await createFixture("otp-c");
    const emailC = `otp-c-${slug}@phase5.test`;
    const bookingC = await createBookingFromQuote(details(fixtureC.quoteId, emailC));
    await requestBookingAccessOtp({
      reference: bookingC.reference,
      email: emailC,
    });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await verifyBookingAccessOtp({
        reference: bookingC.reference,
        email: emailC,
        code: "000000",
      }).catch(() => undefined);
    }
    await expect(
      verifyBookingAccessOtp({
        reference: bookingC.reference,
        email: emailC,
        code: "000000",
      }),
    ).rejects.toMatchObject({ code: "OTP_LOCKED" });

    const sessionA = await persistBookingGuestSession(bookingA.id);
    const loaded = await findActiveGuestSession(hashSessionToken(sessionA.token));
    expect(loaded?.bookingId).toBe(bookingA.id);
    expect(loaded?.bookingId).not.toBe(bookingB.id);

    await revokeBookingGuestSessions(bookingA.id);
    expect(await findActiveGuestSession(hashSessionToken(sessionA.token))).toBeNull();

    const sessionExpired = await persistBookingGuestSession(bookingB.id);
    await sql`
      UPDATE booking_guest_sessions
      SET expires_at = now() - interval '1 minute'
      WHERE booking_id = ${bookingB.id}
    `;
    expect(await findActiveGuestSession(hashSessionToken(sessionExpired.token))).toBeNull();
  });

  it("searches admin bookings by reference, name, email, and phone", async () => {
    const fixture = await createFixture("search");
    const email = `search-${slug}@phase5.test`;
    const booking = await createBookingFromQuote(details(fixture.quoteId, email));
    const byRef = await listAdminBookings({ q: booking.reference });
    expect(byRef.some((row) => row.id === booking.id)).toBe(true);
    const byName = await listAdminBookings({ q: "Ama" });
    expect(byName.some((row) => row.id === booking.id)).toBe(true);
    const byEmail = await listAdminBookings({ q: email });
    expect(byEmail.some((row) => row.id === booking.id)).toBe(true);
    const byPhone = await listAdminBookings({ q: "0241234567" });
    expect(byPhone.some((row) => row.id === booking.id)).toBe(true);
  });
});
