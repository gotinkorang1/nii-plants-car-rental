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
import { PaymentError } from "@/lib/payments/errors";
import { persistBookingGuestSession } from "@/lib/bookings/guest-session";
import {
  markMockPaystackSuccess,
  resetMockPaystackStore,
  setMockPaystackTransaction,
} from "@/lib/payments/paystack/mock-store";
import { reconcilePaystackPayment } from "@/lib/payments/reconcile-paystack-payment";
import { POST as paystackWebhookPost } from "@/app/api/webhooks/paystack/route";
import { computePaystackSignature } from "@/lib/payments/paystack/signature";
import type { CustomerDetailsValues } from "@/lib/validation/booking";

config({ path: ".env.local" });
config();
process.env.PAYSTACK_MOCK = "1";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Phase 6 payment tests.");
}

describe("phase 6 payments", () => {
  let sql: postgres.Sql;
  const locationId = randomUUID();
  const slug = `p6-${locationId.slice(0, 8)}`;
  const quoteIds: string[] = [];
  const classIds: string[] = [];
  const emails: string[] = [];

  beforeAll(async () => {
    sql = postgres(databaseUrl, { max: 12 });
    const [{ exists }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'payments'
      ) AS exists
    `;
    if (!exists) {
      await sql.end({ timeout: 1 });
      throw new Error("payments table is missing. Run `npm run db:migrate`.");
    }
    await sql`
      INSERT INTO locations (id, name, slug, type, active)
      VALUES (${locationId}, ${`Phase 6 ${slug}`}, ${slug}, 'branch', true)
    `;
  });

  beforeEach(() => {
    resetMockPaystackStore();
  });

  afterAll(async () => {
    if (quoteIds.length > 0) {
      await sql`DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE quote_id = ANY(${quoteIds}::uuid[]))`;
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

  async function createFixture(name: string, pickup = "2031-08-20T10:00:00Z") {
    const classId = randomUUID();
    const modelId = randomUUID();
    const quoteId = randomUUID();
    const vehicleId = randomUUID();
    const classSlug = `${slug}-${name}`;
    classIds.push(classId);
    quoteIds.push(quoteId);
    await sql`
      INSERT INTO vehicle_classes (
        id, name, slug, description, seats, luggage, transmission,
        default_daily_rate, default_security_deposit, active
      )
      VALUES (
        ${classId}, ${`P6 ${classSlug}`}, ${classSlug}, 'Phase 6 fixture',
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
        ${vehicleId}, ${modelId}, ${classId}, ${`P6-${name}`},
        ${`REG-P6-${name}`}, 'White', 1000, 'available', ${locationId}
      )
    `;
    await sql`
      INSERT INTO vehicle_inventory_slots (vehicle_model_id, pickup_location_id, slot_number)
      SELECT ${modelId}, ${locationId}, slot_number
      FROM generate_series(1, 10) AS slots(slot_number)
      ON CONFLICT DO NOTHING
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
        ${pickup}, '2031-08-22T10:00:00Z', 2, 35000, 70000, 0,
        0, 100000, 25000, 75000, 150000, ${sql.json({ version: 1 })}::jsonb,
        now() + interval '20 minutes'
      )
    `;
    await sql`
      SELECT allocation_id FROM create_vehicle_hold(
        ${modelId}::uuid, ${locationId}::uuid,
        ${pickup}::timestamptz,
        '2031-08-22T10:00:00Z'::timestamptz,
        ${quoteId}::uuid,
        10::integer,
        null::uuid
      )
    `;
    return { classId, modelId, quoteId, vehicleId };
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

  async function createPaidBooking(name: string) {
    const fixture = await createFixture(name);
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `${name}-${slug}@phase6.test`),
    );
    await authenticateBooking(booking.id);
    const payment = await createPaymentAttempt({ bookingId: booking.id });
    markMockPaystackSuccess(payment.providerReference);
    await reconcilePaystackPayment(payment.providerReference, "webhook");
    return { fixture, booking, payment };
  }

  it("confirms a reservation payment and allocation", async () => {
    const { booking, payment } = await createPaidBooking("reservation");
    const [row] = await sql<{
      status: string;
      amount_paid: number;
      remaining_balance: number;
    }[]>`
      SELECT status, amount_paid, remaining_balance FROM bookings WHERE id = ${booking.id}
    `;
    const [allocation] = await sql<{ status: string }[]>`
      SELECT status FROM vehicle_allocations WHERE booking_id = ${booking.id}
    `;
    const [pay] = await sql<{ status: string; amount: number; purpose: string }[]>`
      SELECT status, amount, purpose FROM payments WHERE provider_reference = ${payment.providerReference}
    `;
    expect(pay?.purpose).toBe("reservation");
    expect(pay?.amount).toBe(25000);
    expect(pay?.status).toBe("succeeded");
    expect(row?.status).toBe("confirmed");
    expect(row?.amount_paid).toBe(25000);
    expect(row?.remaining_balance).toBe(75000);
    expect(allocation?.status).toBe("confirmed");
  });

  it("uses full rental when pickup is inside balance due hours", async () => {
    const pickup = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    const fixture = await createFixture("full-rental", pickup);
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `full-${slug}@phase6.test`),
    );
    await authenticateBooking(booking.id);
    const payment = await createPaymentAttempt({ bookingId: booking.id });
    expect(payment.purpose).toBe("full_rental");
    expect(payment.amount).toBe(100000);
    markMockPaystackSuccess(payment.providerReference);
    await reconcilePaystackPayment(payment.providerReference, "webhook");
    const [row] = await sql<{ amount_paid: number; remaining_balance: number; status: string }[]>`
      SELECT amount_paid, remaining_balance, status FROM bookings WHERE id = ${booking.id}
    `;
    expect(row?.status).toBe("confirmed");
    expect(row?.amount_paid).toBe(100000);
    expect(row?.remaining_balance).toBe(0);
  });

  it("applies balance payments without reconfirming", async () => {
    const { booking, payment: initial } = await createPaidBooking("balance-base");
    const balance = await createPaymentAttempt({
      bookingId: booking.id,
      purpose: "balance",
    });
    expect(balance.amount).toBe(75000);
    markMockPaystackSuccess(balance.providerReference);
    await reconcilePaystackPayment(balance.providerReference, "webhook");
    const [row] = await sql<{ status: string; amount_paid: number; remaining_balance: number }[]>`
      SELECT status, amount_paid, remaining_balance FROM bookings WHERE id = ${booking.id}
    `;
    expect(row?.status).toBe("confirmed");
    expect(row?.amount_paid).toBe(100000);
    expect(row?.remaining_balance).toBe(0);
    expect(initial.providerReference).not.toBe(balance.providerReference);
  });

  it("rejects balance payment attempts before confirmation", async () => {
    const fixture = await createFixture("balance-block");
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `balance-block-${slug}@phase6.test`),
    );
    await authenticateBooking(booking.id);
    await expect(
      createPaymentAttempt({ bookingId: booking.id, purpose: "balance" }),
    ).rejects.toBeInstanceOf(PaymentError);
  });

  it("handles duplicate success webhooks idempotently", async () => {
    const { booking, payment } = await createPaidBooking("dup-webhook");
    await Promise.all(
      Array.from({ length: 10 }, () =>
        reconcilePaystackPayment(payment.providerReference, "webhook"),
      ),
    );
    const [{ count: paymentCount }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM payments
      WHERE provider_reference = ${payment.providerReference} AND status = 'succeeded'
    `;
    const [{ count: historyCount }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM booking_status_history
      WHERE booking_id = ${booking.id} AND to_status = 'confirmed'
    `;
    expect(Number(paymentCount)).toBe(1);
    expect(Number(historyCount)).toBe(1);
  });

  it("reallocates after late payment when capacity remains", async () => {
    const fixture = await createFixture("late-yes");
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `late-yes-${slug}@phase6.test`),
    );
    await authenticateBooking(booking.id);
    const payment = await createPaymentAttempt({ bookingId: booking.id });
    await sql`
      UPDATE vehicle_allocations
      SET status = 'expired', expires_at = now() - interval '5 minutes'
      WHERE booking_id = ${booking.id}
    `;
    markMockPaystackSuccess(payment.providerReference);
    await reconcilePaystackPayment(payment.providerReference, "webhook");
    const [row] = await sql<{ status: string }[]>`
      SELECT status FROM bookings WHERE id = ${booking.id}
    `;
    const allocations = await sql<{ status: string }[]>`
      SELECT status FROM vehicle_allocations WHERE booking_id = ${booking.id}
    `;
    expect(row?.status).toBe("confirmed");
    expect(allocations.some((item) => item.status === "confirmed")).toBe(true);
  });

  it("moves to under_review when late payment finds no capacity", async () => {
    const fixture = await createFixture("late-no");
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `late-no-${slug}@phase6.test`),
    );
    await authenticateBooking(booking.id);
    const payment = await createPaymentAttempt({ bookingId: booking.id });
    await sql`
      UPDATE vehicle_allocations
      SET status = 'expired', expires_at = now() - interval '5 minutes'
      WHERE booking_id = ${booking.id}
    `;
    await sql`
      INSERT INTO vehicle_allocations (
        vehicle_id, quote_id, allocation_type, status, start_at, end_at, expires_at
      )
      VALUES (
        ${fixture.vehicleId},
        ${fixture.quoteId},
        'booking',
        'confirmed',
        '2031-08-10T10:00:00Z',
        '2031-08-25T10:00:00Z',
        null
      )
    `;
    markMockPaystackSuccess(payment.providerReference);
    await reconcilePaystackPayment(payment.providerReference, "webhook");
    const [row] = await sql<{ status: string; amount_paid: number }[]>`
      SELECT status, amount_paid FROM bookings WHERE id = ${booking.id}
    `;
    expect(row?.status).toBe("under_review");
    expect(row?.amount_paid).toBe(25000);
  });

  it("flags amount mismatch for review without confirming", async () => {
    const { booking, payment } = await createPaidBooking("amount-mismatch");
    await sql`UPDATE payments SET status = 'provider_pending' WHERE provider_reference = ${payment.providerReference}`;
    await sql`UPDATE bookings SET status = 'payment_pending', amount_paid = 0, remaining_balance = 100000 WHERE id = ${booking.id}`;
    setMockPaystackTransaction({
      reference: payment.providerReference,
      amount: payment.amount + 100,
      currency: "GHS",
      email: "x@example.com",
      status: "success",
      transactionId: "tx-mismatch",
      channel: "mock",
      paidAt: new Date().toISOString(),
    });
    const result = await reconcilePaystackPayment(payment.providerReference, "webhook");
    expect(result.reviewRequired).toBe(true);
    expect(result.bookingStatus).toBe("payment_pending");
  });

  it("deduplicates concurrent payment initialization", async () => {
    const fixture = await createFixture("init-dup");
    const booking = await createBookingFromQuote(
      details(fixture.quoteId, `init-dup-${slug}@phase6.test`),
    );
    await authenticateBooking(booking.id);
    const attempts = await Promise.allSettled([
      createPaymentAttempt({ bookingId: booking.id }),
      createPaymentAttempt({ bookingId: booking.id }),
    ]);
    const fulfilled = attempts.filter((item) => item.status === "fulfilled");
    expect(fulfilled.length).toBe(2);
    const refs = fulfilled.map(
      (item) => (item as PromiseFulfilledResult<Awaited<ReturnType<typeof createPaymentAttempt>>>).value.providerReference,
    );
    expect(new Set(refs).size).toBe(1);
    const [{ count }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM payments
      WHERE booking_id = ${booking.id}
        AND purpose IN ('reservation', 'full_rental')
        AND status IN ('created', 'provider_pending')
    `;
    expect(Number(count)).toBe(1);
  });

  it("rejects invalid webhook signatures without mutating state", async () => {
    const { payment } = await createPaidBooking("sig");
    const body = JSON.stringify({
      event: "charge.success",
      data: { reference: payment.providerReference },
    });
    expect(computePaystackSignature(JSON.stringify({ tampered: true }))).not.toBe(
      computePaystackSignature(body),
    );
    const [before] = await sql<{ status: string }[]>`
      SELECT status FROM payments WHERE provider_reference = ${payment.providerReference}
    `;
    expect(before?.status).toBe("succeeded");

    const response = await paystackWebhookPost(
      new Request("http://localhost/api/webhooks/paystack", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-paystack-signature": "invalid-signature",
        },
        body,
      }),
    );
    expect(response.status).toBe(401);

    const [after] = await sql<{ status: string }[]>`
      SELECT status FROM payments WHERE provider_reference = ${payment.providerReference}
    `;
    expect(after?.status).toBe("succeeded");
  });
});
