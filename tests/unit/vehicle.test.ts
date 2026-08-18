import { describe, expect, it } from "vitest";

import { vehicleSchema } from "@/lib/validation/vehicle";

const id = "11111111-1111-4111-8111-111111111111";

describe("physical vehicle validation", () => {
  it("accepts a consistent internal unit", () => {
    const parsed = vehicleSchema.parse({
      vehicleModelId: id,
      internalCode: "ACC-001",
      registrationNumber: "GR-1234-21",
      colour: "White",
      currentMileage: 0,
      status: "available",
      branchLocationId: id,
      notes: "",
    });

    expect(parsed.notes).toBeNull();
    expect(parsed.currentMileage).toBe(0);
  });

  it("rejects negative mileage and blank internal codes", () => {
    const mileage = vehicleSchema.safeParse({
      vehicleModelId: id,
      internalCode: "ACC-001",
      registrationNumber: "GR-1234-21",
      colour: "White",
      currentMileage: -1,
      status: "available",
      branchLocationId: id,
    });
    const code = vehicleSchema.safeParse({
      vehicleModelId: id,
      internalCode: "  ",
      registrationNumber: "GR-1234-21",
      colour: "White",
      currentMileage: 10,
      status: "available",
      branchLocationId: id,
    });

    expect(mileage.success).toBe(false);
    expect(code.success).toBe(false);
  });
});
