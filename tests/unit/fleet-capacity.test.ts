import { describe, expect, it } from "vitest";

import {
  INVENTORY_CAPACITY_PER_MODEL_LOCATION,
  remainingInventoryCapacity,
} from "@/lib/availability/inventory-capacity";

describe("model/location inventory capacity", () => {
  it("uses ten slots per model and pickup location", () => {
    expect(INVENTORY_CAPACITY_PER_MODEL_LOCATION).toBe(10);
    expect(remainingInventoryCapacity(0)).toBe(10);
    expect(remainingInventoryCapacity(7)).toBe(3);
    expect(remainingInventoryCapacity(10)).toBe(0);
    expect(remainingInventoryCapacity(14)).toBe(0);
  });
});
