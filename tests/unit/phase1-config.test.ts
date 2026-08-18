import { describe, expect, it } from "vitest";

import { publicEnvSchema } from "@/lib/env";
import {
  seedLocations,
  seedPhysicalVehicles,
  seedVehicleClasses,
  seedVehicleModels,
} from "@/lib/db/seed-data";

describe("environment validation", () => {
  it("still allows builds without live credentials", () => {
    expect(
      publicEnvSchema.parse({
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      }).NEXT_PUBLIC_SUPABASE_URL,
    ).toBeUndefined();
  });
});

describe("catalogue seed data", () => {
  it("uses development-only placeholder rates for self-drive classes", () => {
    expect(seedLocations.length).toBeGreaterThan(0);
    expect(seedVehicleClasses.length).toBeGreaterThan(0);

    for (const location of seedLocations) {
      expect(location.slug.length).toBeGreaterThan(0);
    }

    const selfDriveSlugs = new Set([
      "compact-sedan",
      "mid-size-sedan",
      "luxury-sedan",
      "compact-suv",
      "suv",
      "4x4",
    ]);
    const enquirySlugs = new Set(["van", "coach", "earth-moving"]);

    for (const vehicleClass of seedVehicleClasses) {
      if (selfDriveSlugs.has(vehicleClass.slug)) {
        expect(vehicleClass.defaultDailyRate).toBeGreaterThan(0);
        expect(vehicleClass.defaultSecurityDeposit).toBeGreaterThan(0);
      }

      if (enquirySlugs.has(vehicleClass.slug)) {
        expect(vehicleClass.defaultDailyRate).toBe(0);
        expect(vehicleClass.defaultSecurityDeposit).toBe(0);
      }
    }
  });

  it("includes published and unpublished models and internal physical units", () => {
    expect(seedVehicleModels.some((model) => model.published)).toBe(true);
    expect(seedVehicleModels.some((model) => !model.published)).toBe(true);
    expect(seedPhysicalVehicles[0]?.internalCode).toBe("NP-UNIT-001");
    expect(seedPhysicalVehicles[0]?.registrationNumber).toMatch(/^INTERNAL-UNSET-/);
  });
});
