import { describe, expect, it } from "vitest";

import {
  assertAssignableVehicle,
  type AssignmentCandidate,
} from "@/lib/operations/assign-booking-vehicle";

const base: AssignmentCandidate = {
  expectedModelId: "model-1",
  expectedLocationId: "location-1",
  vehicleModelId: "model-1",
  branchLocationId: "location-1",
  status: "available",
  overlaps: false,
};

describe("physical vehicle assignment", () => {
  it("accepts an available vehicle for the exact model and pickup location", () => {
    expect(() => assertAssignableVehicle(base)).not.toThrow();
  });

  it.each([
    ["wrong model", { vehicleModelId: "model-2" }],
    ["wrong location", { branchLocationId: "location-2" }],
    ["maintenance vehicle", { status: "maintenance" as const }],
    ["overlapping vehicle", { overlaps: true }],
  ])("rejects %s", (_label, override) => {
    expect(() =>
      assertAssignableVehicle({ ...base, ...override }),
    ).toThrow();
  });
});
