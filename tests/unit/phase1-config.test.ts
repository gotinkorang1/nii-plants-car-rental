import { describe, expect, it } from "vitest";

import { publicEnvSchema } from "@/lib/env";
import {
  seedLocations,
  seedPhysicalVehicles,
  seedVehicleClasses,
  seedVehicleModels,
} from "@/lib/db/seed-data";
import { usdToPesewas } from "@/lib/money";

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
  it("uses published shop USD rates and converted GHS booking floors", () => {
    expect(seedLocations.length).toBeGreaterThan(0);
    expect(seedVehicleClasses.length).toBeGreaterThan(0);

    for (const location of seedLocations) {
      expect(location.slug.length).toBeGreaterThan(0);
      expect(location.latitude).toBeGreaterThan(0);
      expect(location.longitude).toBeLessThan(0);
    }

    const selfDriveRates: Record<string, { from: number; to: number }> = {
      "compact-sedan": { from: 65, to: 65 },
      "mid-size-sedan": { from: 80, to: 100 },
      "luxury-sedan": { from: 120, to: 140 },
      "compact-suv": { from: 88, to: 105 },
      suv: { from: 100, to: 120 },
      "4x4": { from: 120, to: 170 },
    };
    const enquiryRates: Record<string, { from: number; to: number }> = {
      van: { from: 120, to: 150 },
      coach: { from: 150, to: 240 },
    };

    for (const vehicleClass of seedVehicleClasses) {
      const selfDrive = selfDriveRates[vehicleClass.slug];
      if (selfDrive) {
        expect(
          "usdDailyRateFrom" in vehicleClass ? vehicleClass.usdDailyRateFrom : undefined,
        ).toBe(selfDrive.from);
        expect(
          "usdDailyRateTo" in vehicleClass ? vehicleClass.usdDailyRateTo : undefined,
        ).toBe(selfDrive.to);
        expect(vehicleClass.defaultDailyRate).toBe(usdToPesewas(selfDrive.from));
        expect(vehicleClass.defaultSecurityDeposit).toBeGreaterThan(0);
      }

      const enquiry = enquiryRates[vehicleClass.slug];
      if (enquiry) {
        expect(
          "usdDailyRateFrom" in vehicleClass ? vehicleClass.usdDailyRateFrom : undefined,
        ).toBe(enquiry.from);
        expect(
          "usdDailyRateTo" in vehicleClass ? vehicleClass.usdDailyRateTo : undefined,
        ).toBe(enquiry.to);
        expect(vehicleClass.defaultDailyRate).toBe(0);
        expect(vehicleClass.defaultSecurityDeposit).toBe(0);
      }

      if (vehicleClass.slug === "earth-moving") {
        expect(vehicleClass.active).toBe(false);
        expect(vehicleClass.defaultDailyRate).toBe(0);
      }
    }
  });

  it("includes published and unpublished models and internal physical units", () => {
    const shopModels = seedVehicleModels.filter((model) =>
      [
        "kia-pegas",
        "hyundai-accent",
        "hyundai-elantra",
        "kia-cerato",
        "honda-accord",
        "hyundai-creta",
        "kia-seltos",
        "kia-sportage",
        "hyundai-tucson",
        "mitsubishi-pajero",
        "toyota-land-cruiser-prado",
        "toyota-hiace",
        "toyota-coaster-30-seater",
      ].includes(model.slug),
    );

    expect(shopModels).toHaveLength(13);
    expect(shopModels.every((model) => model.published)).toBe(true);
    expect(
      shopModels.every(
        (model) =>
          typeof model.usdDailyRateFrom === "number" &&
          typeof model.usdDailyRateTo === "number",
      ),
    ).toBe(true);

    const hondaAccord = seedVehicleModels.find((model) => model.slug === "honda-accord");
    expect(hondaAccord?.make).toBe("Honda");
    expect(hondaAccord?.usdDailyRateFrom).toBe(120);
    expect(hondaAccord?.usdDailyRateTo).toBe(140);

    expect(
      seedVehicleModels.find((model) => model.slug === "hyundai-h1")?.published,
    ).toBe(false);
    expect(
      seedVehicleModels.find((model) => model.slug === "earth-moving-archive")
        ?.published,
    ).toBe(false);
    expect(seedPhysicalVehicles[0]?.internalCode).toBe("NP-UNIT-001");
    expect(seedPhysicalVehicles[0]?.registrationNumber).toMatch(/^INTERNAL-UNSET-/);
  });
});
