import { randomUUID } from "node:crypto";

import { config } from "dotenv";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Phase 4 hold tests. Configure .env.local and run `npm run db:migrate`.",
  );
}

type Fleet = {
  classId: string;
  modelId: string;
  quoteId: string;
  vehicleIds: string[];
};

describe("vehicle hold concurrency and occupancy", () => {
  let sql: postgres.Sql;
  const locationId = randomUUID();
  const slug = `hold-test-${locationId.slice(0, 8)}`;
  let staffAuthId: string = randomUUID();
  let staffProfileId: string | undefined;
  const fleets: Fleet[] = [];

  beforeAll(async () => {
    sql = postgres(databaseUrl, { max: 25 });
    const [{ exists }] = await sql<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'create_vehicle_hold'
      ) AS exists
    `;
    if (!exists) {
      await sql.end({ timeout: 1 });
      throw new Error(
        "create_vehicle_hold is missing. Run `npm run db:migrate` before concurrency tests.",
      );
    }

    await sql`
      INSERT INTO locations (id, name, slug, type, active)
      VALUES (${locationId}, ${`Hold test ${slug}`}, ${slug}, 'branch', true)
    `;
    staffProfileId = await createStaffProfile();
  });

  afterAll(async () => {
    const classIds = fleets.map((fleet) => fleet.classId);
    if (classIds.length > 0) {
      await sql`DELETE FROM vehicle_allocations WHERE vehicle_id IN (
        SELECT id FROM vehicles WHERE vehicle_class_id = ANY(${classIds}::uuid[])
      )`;
      await sql`DELETE FROM quotes WHERE vehicle_class_id = ANY(${classIds}::uuid[])`;
      await sql`DELETE FROM vehicles WHERE vehicle_class_id = ANY(${classIds}::uuid[])`;
      await sql`DELETE FROM vehicle_models WHERE vehicle_class_id = ANY(${classIds}::uuid[])`;
      await sql`DELETE FROM vehicle_classes WHERE id = ANY(${classIds}::uuid[])`;
    }
    await sql`DELETE FROM locations WHERE id = ${locationId}`;
    if (staffProfileId) {
      await sql`DELETE FROM staff_profiles WHERE id = ${staffProfileId}`;
    }
    await sql`DELETE FROM auth.users WHERE id = ${staffAuthId}`;
    await sql.end({ timeout: 1 });
  });

  async function createStaffProfile(): Promise<string> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRole) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the staff/customer race test.",
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
        email: `hold-staff-${slug}@localhost`,
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
        'Hold test staff',
        ${`hold-staff-${slug}@localhost`},
        'reservations',
        true
      )
      RETURNING id
    `;
    if (!staff) {
      throw new Error("Could not insert staff_profiles row for hold tests.");
    }
    return staff.id;
  }

  async function createFleet(input: {
    name: string;
    vehicles: Array<{ status?: "available" | "inactive" | "maintenance" }>;
  }): Promise<Fleet> {
    const classId = randomUUID();
    const modelId = randomUUID();
    const quoteId = randomUUID();
    const classSlug = `${slug}-${input.name}`;
    await sql`
      INSERT INTO vehicle_classes (
        id, name, slug, description, seats, luggage, transmission,
        default_daily_rate, default_security_deposit, active
      )
      VALUES (
        ${classId}, ${`Hold ${input.name}`}, ${classSlug}, 'Concurrency fixture',
        4, 2, 'automatic', 35000, 150000, true
      )
    `;
    await sql`
      INSERT INTO vehicle_models (
        id, vehicle_class_id, make, model, slug, description, seats, doors,
        transmission, fuel_type, luggage, air_conditioning, featured, published
      )
      VALUES (
        ${modelId}, ${classId}, 'Hold', ${input.name}, ${classSlug},
        'Exact model', 4, 4, 'automatic', 'petrol', 2, true, false, true
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
        '2030-08-10T10:00:00Z', '2030-08-11T10:00:00Z', 1, 35000, 35000, 0,
        0, 35000, 8750, 26250, 150000, ${sql.json({ version: 1 })}::jsonb,
        now() + interval '15 minutes'
      )
    `;

    const vehicleIds: string[] = [];
    for (const [index, vehicle] of input.vehicles.entries()) {
      const vehicleId = randomUUID();
      vehicleIds.push(vehicleId);
      await sql`
        INSERT INTO vehicles (
          id, vehicle_model_id, vehicle_class_id, internal_code, registration_number,
          colour, current_mileage, status, branch_location_id
        )
        VALUES (
          ${vehicleId}, ${modelId}, ${classId}, ${`${input.name}-${index}`},
          ${`REG-${input.name}-${index}`}, 'White', 1000,
          ${vehicle.status ?? "available"}, ${locationId}
        )
      `;
    }

    const fleet = { classId, modelId, quoteId, vehicleIds };
    fleets.push(fleet);
    return fleet;
  }

  async function hold(
    fleet: Fleet,
    input: {
      pickup: string;
      dropoff: string;
      minutes?: number;
      createdBy?: string | null;
    },
  ) {
    return sql`
      SELECT allocation_id, vehicle_id
      FROM create_vehicle_hold(
        ${fleet.classId}::uuid,
        ${fleet.modelId}::uuid,
        ${input.pickup}::timestamptz,
        ${input.dropoff}::timestamptz,
        ${fleet.quoteId}::uuid,
        ${input.minutes ?? 10}::integer,
        ${input.createdBy ?? null}::uuid
      )
    `;
  }

  async function activeOverlappingCount(
    vehicleIds: string[],
    start: string,
    end: string,
  ) {
    const [row] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count
      FROM vehicle_allocations
      WHERE vehicle_id = ANY(${vehicleIds}::uuid[])
        AND status IN ('hold', 'confirmed', 'ready', 'checked_out')
        AND start_at < ${end}::timestamptz
        AND end_at > ${start}::timestamptz
        AND NOT (status = 'hold' AND expires_at IS NOT NULL AND expires_at <= now())
    `;
    return row?.count ?? 0;
  }

  it("allows only one of 20 concurrent holds on a single vehicle", async () => {
    const fleet = await createFleet({ name: "one20", vehicles: [{}] });
    const pickup = "2030-08-10T10:00:00Z";
    const dropoff = "2030-08-11T10:00:00Z";

    const attempts = await Promise.allSettled(
      Array.from({ length: 20 }, () => hold(fleet, { pickup, dropoff })),
    );

    expect(attempts.filter((item) => item.status === "fulfilled").length).toBe(1);
    expect(attempts.filter((item) => item.status === "rejected").length).toBe(19);
    expect(await activeOverlappingCount(fleet.vehicleIds, pickup, dropoff)).toBe(1);
  });

  it("allows only one of 50 concurrent holds on a single vehicle", async () => {
    const fleet = await createFleet({ name: "one50", vehicles: [{}] });
    const pickup = "2030-08-20T10:00:00Z";
    const dropoff = "2030-08-21T10:00:00Z";

    const attempts = await Promise.allSettled(
      Array.from({ length: 50 }, () => hold(fleet, { pickup, dropoff })),
    );

    expect(attempts.filter((item) => item.status === "fulfilled").length).toBe(1);
    expect(attempts.filter((item) => item.status === "rejected").length).toBe(49);
    expect(await activeOverlappingCount(fleet.vehicleIds, pickup, dropoff)).toBe(1);
  });

  it("allows 3 concurrent holds across 3 vehicles and rejects a fourth", async () => {
    const fleet = await createFleet({
      name: "cap3",
      vehicles: [{}, {}, {}],
    });
    const pickup = "2030-09-10T10:00:00Z";
    const dropoff = "2030-09-11T10:00:00Z";

    const attempts = await Promise.allSettled(
      Array.from({ length: 4 }, () => hold(fleet, { pickup, dropoff })),
    );
    const successful = attempts.filter((item) => item.status === "fulfilled");
    expect(successful.length).toBe(3);
    expect(attempts.filter((item) => item.status === "rejected").length).toBe(1);

    const allocated = successful.map((item) => {
      const row = item.value[0] as { vehicle_id?: string } | undefined;
      return row?.vehicle_id;
    });
    expect(new Set(allocated).size).toBe(3);
    expect(allocated.every((id) => id && fleet.vehicleIds.includes(id))).toBe(true);
  });

  it("lets only one of a public hold and a staff-assisted hold succeed", async () => {
    const fleet = await createFleet({ name: "race", vehicles: [{}] });
    const pickup = "2030-09-20T10:00:00Z";
    const dropoff = "2030-09-21T10:00:00Z";

    const attempts = await Promise.allSettled([
      hold(fleet, { pickup, dropoff, createdBy: null }),
      hold(fleet, { pickup, dropoff, createdBy: staffProfileId }),
    ]);

    expect(attempts.filter((item) => item.status === "fulfilled").length).toBe(1);
    expect(attempts.filter((item) => item.status === "rejected").length).toBe(1);
    expect(await activeOverlappingCount(fleet.vehicleIds, pickup, dropoff)).toBe(1);
  });

  it("allows adjacent half-open ranges and rejects partial overlaps", async () => {
    const fleet = await createFleet({ name: "range", vehicles: [{}] });
    const vehicleId = fleet.vehicleIds[0];

    const first = await hold(fleet, {
      pickup: "2030-10-01T10:00:00Z",
      dropoff: "2030-10-01T14:00:00Z",
    });
    expect(first[0]?.vehicle_id).toBe(vehicleId);

    const adjacent = await hold(fleet, {
      pickup: "2030-10-01T14:00:00Z",
      dropoff: "2030-10-01T18:00:00Z",
    });
    expect(adjacent[0]?.vehicle_id).toBe(vehicleId);

    await expect(
      hold(fleet, {
        pickup: "2030-10-01T13:00:00Z",
        dropoff: "2030-10-01T15:00:00Z",
      }),
    ).rejects.toThrow(/VEHICLE_UNAVAILABLE|exclusion/i);

    await expect(
      hold(fleet, {
        pickup: "2030-10-01T09:00:00Z",
        dropoff: "2030-10-01T11:00:00Z",
      }),
    ).rejects.toThrow(/VEHICLE_UNAVAILABLE|exclusion/i);

    await expect(
      hold(fleet, {
        pickup: "2030-10-01T11:00:00Z",
        dropoff: "2030-10-01T12:00:00Z",
      }),
    ).rejects.toThrow(/VEHICLE_UNAVAILABLE|exclusion/i);
  });

  it("does not let an expired hold block a new allocation", async () => {
    const fleet = await createFleet({ name: "expired", vehicles: [{}] });
    await sql`
      INSERT INTO vehicle_allocations (
        vehicle_id, quote_id, allocation_type, status, start_at, end_at, expires_at
      )
      VALUES (
        ${fleet.vehicleIds[0]}, ${fleet.quoteId}, 'booking', 'hold',
        '2030-10-10T10:00:00Z', '2030-10-11T10:00:00Z', now() - interval '1 minute'
      )
    `;

    const created = await hold(fleet, {
      pickup: "2030-10-10T10:00:00Z",
      dropoff: "2030-10-11T10:00:00Z",
    });
    expect(created[0]?.vehicle_id).toBe(fleet.vehicleIds[0]);
  });

  it("does not let cancelled or completed history block a new allocation", async () => {
    const fleet = await createFleet({ name: "history", vehicles: [{}] });
    await sql`
      INSERT INTO vehicle_allocations (
        vehicle_id, allocation_type, status, start_at, end_at
      )
      VALUES
        (
          ${fleet.vehicleIds[0]}, 'booking', 'cancelled',
          '2030-10-15T10:00:00Z', '2030-10-16T10:00:00Z'
        ),
        (
          ${fleet.vehicleIds[0]}, 'booking', 'completed',
          '2030-10-15T10:00:00Z', '2030-10-16T10:00:00Z'
        )
    `;

    const created = await hold(fleet, {
      pickup: "2030-10-15T10:00:00Z",
      dropoff: "2030-10-16T10:00:00Z",
    });
    expect(created[0]?.vehicle_id).toBe(fleet.vehicleIds[0]);
  });

  it("rejects inactive vehicles", async () => {
    const fleet = await createFleet({
      name: "inactive",
      vehicles: [{ status: "inactive" }],
    });
    await expect(
      hold(fleet, {
        pickup: "2030-11-01T10:00:00Z",
        dropoff: "2030-11-02T10:00:00Z",
      }),
    ).rejects.toThrow(/VEHICLE_UNAVAILABLE/i);
  });

  it("rejects vehicles whose operational status is maintenance", async () => {
    const fleet = await createFleet({
      name: "maintstatus",
      vehicles: [{ status: "maintenance" }],
    });
    await expect(
      hold(fleet, {
        pickup: "2030-11-02T10:00:00Z",
        dropoff: "2030-11-03T10:00:00Z",
      }),
    ).rejects.toThrow(/VEHICLE_UNAVAILABLE/i);
  });

  it("rejects vehicles with an active manual block", async () => {
    const fleet = await createFleet({ name: "manual", vehicles: [{}] });
    await sql`
      INSERT INTO vehicle_allocations (
        vehicle_id, allocation_type, status, start_at, end_at, reason
      )
      VALUES (
        ${fleet.vehicleIds[0]}, 'manual_block', 'confirmed',
        '2030-11-10T10:00:00Z', '2030-11-11T10:00:00Z', 'Staff block fixture'
      )
    `;
    await expect(
      hold(fleet, {
        pickup: "2030-11-10T10:00:00Z",
        dropoff: "2030-11-11T10:00:00Z",
      }),
    ).rejects.toThrow(/VEHICLE_UNAVAILABLE/i);
  });

  it("rejects vehicles with an active maintenance allocation", async () => {
    const fleet = await createFleet({ name: "maintalloc", vehicles: [{}] });
    await sql`
      INSERT INTO vehicle_allocations (
        vehicle_id, allocation_type, status, start_at, end_at, reason
      )
      VALUES (
        ${fleet.vehicleIds[0]}, 'maintenance', 'confirmed',
        '2030-11-12T10:00:00Z', '2030-11-13T10:00:00Z', 'Workshop fixture'
      )
    `;
    await expect(
      hold(fleet, {
        pickup: "2030-11-12T10:00:00Z",
        dropoff: "2030-11-13T10:00:00Z",
      }),
    ).rejects.toThrow(/VEHICLE_UNAVAILABLE/i);
  });

  it("keeps a quote snapshot when rates later change", async () => {
    const fleet = await createFleet({ name: "snapshot", vehicles: [{}] });
    const [quote] = await sql<{ pricing_snapshot: unknown; daily_rate: number }[]>`
      SELECT pricing_snapshot, daily_rate FROM quotes WHERE id = ${fleet.quoteId}
    `;
    expect(quote?.daily_rate).toBe(35000);

    await sql`
      UPDATE vehicle_classes SET default_daily_rate = 99999 WHERE id = ${fleet.classId}
    `;
    const [again] = await sql<{ pricing_snapshot: unknown; daily_rate: number }[]>`
      SELECT pricing_snapshot, daily_rate FROM quotes WHERE id = ${fleet.quoteId}
    `;
    expect(again?.daily_rate).toBe(35000);
    expect(again?.pricing_snapshot).toEqual(quote?.pricing_snapshot);
  });
});
