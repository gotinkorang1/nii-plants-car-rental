import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

describe("capacity hold migration", () => {
  it("qualifies returned allocation columns to avoid PL/pgSQL ambiguity", () => {
    const sql = readFileSync(
      path.join(root, "drizzle/0014_fix_vehicle_hold_return.sql"),
      "utf8",
    );

    expect(sql).toContain("RETURNING\n    vehicle_allocations.id,");
    expect(sql).toContain("vehicle_allocations.inventory_slot_id,");
    expect(sql).toContain("vehicle_allocations.vehicle_id");
  });
});
