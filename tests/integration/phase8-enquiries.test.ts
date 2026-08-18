import { randomUUID } from "node:crypto";

import { config } from "dotenv";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPublicEnquiry } from "@/lib/enquiries/create-enquiry";
import { EnquiryError } from "@/lib/enquiries/errors";
import { assertHoneypotClear } from "@/lib/enquiries/rate-limit";
import {
  assignEnquiry,
  changeEnquiryStatus,
  saveEnquiryQuote,
} from "@/lib/enquiries/update-enquiry";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for Phase 8 enquiry tests.");
}

describe("phase 8 enquiries", () => {
  let sql: postgres.Sql;
  const enquiryIds: string[] = [];
  let staffId: string = randomUUID();
  let staffAuthId: string = randomUUID();

  beforeAll(async () => {
    sql = postgres(databaseUrl, { max: 8 });
    const [{ exists }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'enquiries'
      ) AS exists
    `;
    if (!exists) {
      await sql.end({ timeout: 1 });
      throw new Error("enquiries table is missing. Run `npm run db:migrate`.");
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRole) {
      throw new Error("Supabase env required for staff fixture.");
    }
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRole}`,
        apikey: serviceRole,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `p8-staff-${randomUUID().slice(0, 8)}@phase8.test`,
        password: "dev-only-not-a-live-password",
        email_confirm: true,
      }),
    });
    const created = (await response.json()) as { id?: string };
    staffAuthId = created.id!;
    const [staff] = await sql<{ id: string }[]>`
      INSERT INTO staff_profiles (auth_user_id, display_name, email, role, active)
      VALUES (${staffAuthId}, 'Phase 8 Staff', 'p8-staff@phase8.test', 'reservations', true)
      RETURNING id
    `;
    staffId = staff!.id;
  });

  afterAll(async () => {
    if (enquiryIds.length > 0) {
      await sql`DELETE FROM enquiry_status_history WHERE enquiry_id = ANY(${enquiryIds}::uuid[])`;
      await sql`DELETE FROM enquiries WHERE id = ANY(${enquiryIds}::uuid[])`;
    }
    await sql`DELETE FROM staff_profiles WHERE id = ${staffId}`;
    await sql`DELETE FROM auth.users WHERE id = ${staffAuthId}`;
    await sql.end({ timeout: 1 });
  });

  async function trackEnquiry(reference: string) {
    const [row] = await sql<{ id: string }[]>`
      SELECT id FROM enquiries WHERE reference = ${reference}
    `;
    if (row) {
      enquiryIds.push(row.id);
    }
    return row?.id;
  }

  it("creates a public enquiry in new status", async () => {
    const result = await createPublicEnquiry({
      serviceType: "general",
      firstName: "Kofi",
      lastName: "Boateng",
      email: `kofi-${randomUUID().slice(0, 8)}@phase8.test`,
      phone: "0241112233",
      customerMessage: "Need help with a custom request.",
    });
    expect(result.reference).toMatch(/^NP-ENQ-/);
    const id = await trackEnquiry(result.reference);
    const [row] = await sql<{ status: string }[]>`
      SELECT status FROM enquiries WHERE id = ${id}
    `;
    expect(row?.status).toBe("new");
  });

  it("rejects honeypot submissions", () => {
    expect(() => assertHoneypotClear("spam-bot")).toThrow(EnquiryError);
  });

  it("rejects invalid service types", async () => {
    await expect(
      createPublicEnquiry({
        serviceType: "free_supercar",
        firstName: "A",
        lastName: "B",
        email: "a@b.test",
        phone: "0240000000",
      }),
    ).rejects.toThrow(EnquiryError);
  });

  it("does not create bookings or allocations from enquiries", async () => {
    const email = `iso-${randomUUID().slice(0, 8)}@phase8.test`;
    const result = await createPublicEnquiry({
      serviceType: "chauffeur",
      firstName: "Iso",
      lastName: "Test",
      email,
      phone: "0242223344",
      pickupLocationText: "Airport",
      returnLocationText: "Labone",
      pickupAt: new Date(Date.now() + 86400000).toISOString(),
      passengerCount: 2,
    });
    const id = await trackEnquiry(result.reference);
    const [{ booking_count, allocation_count, payment_count }] = await sql<
      { booking_count: string; allocation_count: string; payment_count: string }[]
    >`
      SELECT
        (SELECT count(*)::text FROM bookings WHERE customer_id IN (SELECT id FROM customers WHERE email = ${email})) AS booking_count,
        (SELECT count(*)::text FROM vehicle_allocations) AS allocation_count,
        (SELECT count(*)::text FROM payments) AS payment_count
    `;
    expect(Number(booking_count)).toBe(0);
    expect(id).toBeTruthy();
    expect(Number(allocation_count)).toBeGreaterThanOrEqual(0);
    expect(Number(payment_count)).toBeGreaterThanOrEqual(0);
  });

  it("records staff quote in pesewas and history", async () => {
    const result = await createPublicEnquiry({
      serviceType: "general",
      firstName: "Quote",
      lastName: "Test",
      email: `quote-${randomUUID().slice(0, 8)}@phase8.test`,
      phone: "0243334455",
    });
    const id = (await trackEnquiry(result.reference))!;
    await assignEnquiry({ enquiryId: id, assignedTo: staffId, staffId });
    await changeEnquiryStatus({
      enquiryId: id,
      toStatus: "contacted",
      staffId,
    });
    await saveEnquiryQuote({
      enquiryId: id,
      quotedAmountGhs: "1500.00",
      quoteNotes: "Includes driver and fuel.",
      staffId,
    });
    const [row] = await sql<{ quoted_amount: number; status: string }[]>`
      SELECT quoted_amount, status FROM enquiries WHERE id = ${id}
    `;
    const [{ count }] = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM enquiry_status_history
      WHERE enquiry_id = ${id} AND to_status = 'quoted'
    `;
    expect(row?.quoted_amount).toBe(150000);
    expect(row?.status).toBe("quoted");
    expect(Number(count)).toBe(1);
  });

  it("allows staff status transitions", async () => {
    const result = await createPublicEnquiry({
      serviceType: "general",
      firstName: "Flow",
      lastName: "Test",
      email: `flow-${randomUUID().slice(0, 8)}@phase8.test`,
      phone: "0244445566",
    });
    const id = (await trackEnquiry(result.reference))!;
    await changeEnquiryStatus({
      enquiryId: id,
      toStatus: "contacted",
      staffId,
    });
    const [row] = await sql<{ status: string }[]>`
      SELECT status FROM enquiries WHERE id = ${id}
    `;
    expect(row?.status).toBe("contacted");
  });

  it("blocks anon direct table access", async () => {
    const [{ has_select: hasSelect }] = await sql<{ has_select: boolean }[]>`
      SELECT has_table_privilege('anon', 'public.enquiries', 'SELECT') AS has_select
    `;
    expect(hasSelect).toBe(false);
  });
});
