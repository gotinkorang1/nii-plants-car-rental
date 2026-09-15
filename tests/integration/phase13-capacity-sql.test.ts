import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "drizzle/0013_capacity_based_inventory.sql",
  "utf8",
);

describe("capacity migration", () => {
  it("creates ten unique slots per model and pickup location", () => {
    expect(migration).toContain("vehicle_inventory_slots");
    expect(migration).toContain("vehicle_model_id");
    expect(migration).toContain("pickup_location_id");
    expect(migration).toContain("slot_number");
    expect(migration).toContain(
      "vehicle_inventory_slots_model_location_slot_uidx",
    );
  });

  it("keeps physical assignment nullable and scopes holds exactly", () => {
    expect(migration).toMatch(/vehicle_id[\s\S]*DROP NOT NULL/);
    expect(migration).toContain("p_pickup_location_id");
    expect(migration).toContain(
      "slot.vehicle_model_id = p_vehicle_model_id",
    );
    expect(migration).toContain(
      "slot.pickup_location_id = p_pickup_location_id",
    );
  });
});
