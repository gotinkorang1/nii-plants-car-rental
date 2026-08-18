import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("phase 4 occupancy SQL", () => {
  it("creates a half-open GiST exclusion constraint and an atomic hold function", () => {
    const sql = readSource("drizzle/0004_phase4_availability_pricing.sql");

    expect(sql).toContain("CREATE EXTENSION IF NOT EXISTS btree_gist");
    expect(sql).toContain("EXCLUDE USING gist");
    expect(sql).toContain("tstzrange(start_at, end_at, '[)')");
    expect(sql).toContain("WHERE (status IN ('hold', 'confirmed', 'ready', 'checked_out'))");
    expect(sql).toContain("create_vehicle_hold");
    expect(sql).toContain("FOR UPDATE OF v SKIP LOCKED");
    expect(sql).toContain("exclusion_violation");
    expect(sql).toContain("VEHICLE_UNAVAILABLE");

    const lockOne = readSource("drizzle/0005_phase4_hold_lock_one.sql");
    expect(lockOne).toContain("LIMIT 1");
    expect(lockOne).toContain("FOR UPDATE OF v SKIP LOCKED");
    expect(sql).not.toMatch(/GRANT SELECT ON TABLE public\.quotes TO anon/);
    expect(sql).not.toMatch(/GRANT SELECT ON TABLE public\.vehicle_allocations TO anon/);
    expect(sql).not.toMatch(
      /GRANT EXECUTE ON FUNCTION public\.create_vehicle_hold[\s\S]*TO anon/,
    );
  });
});

describe("public availability modules", () => {
  it("do not expose physical vehicle internals in public booking UI", () => {
    const files = [
      "src/lib/availability/get-available-models.ts",
      "src/app/api/availability/search/route.ts",
      "src/components/booking/availability-results.tsx",
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source, file).not.toContain("registrationNumber");
      expect(source, file).not.toContain("internalCode");
      expect(source, file).not.toContain("internal_code");
    }
  });
});
