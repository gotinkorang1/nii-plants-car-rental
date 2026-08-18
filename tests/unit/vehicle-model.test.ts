import { describe, expect, it } from "vitest";

import { vehicleModelSchema } from "@/lib/validation/vehicle-model";

const classId = "11111111-1111-4111-8111-111111111111";

describe("vehicle model validation", () => {
  it("requires a class and generates a unique public slug", () => {
    const parsed = vehicleModelSchema.parse({
      vehicleClassId: classId,
      make: "Toyota",
      model: "Corolla",
      slug: "",
      description: "Compact sedan or similar.",
      seats: 5,
      doors: 4,
      transmission: "automatic",
      fuelType: "petrol",
      luggage: 3,
      airConditioning: true,
      featured: false,
      published: false,
    });

    expect(parsed.slug).toBe("toyota-corolla");
    expect(parsed.yearFrom).toBeNull();
    expect(parsed.yearTo).toBeNull();
  });

  it("rejects year_to earlier than year_from", () => {
    const parsed = vehicleModelSchema.safeParse({
      vehicleClassId: classId,
      make: "Toyota",
      model: "Corolla",
      description: "Sedan",
      seats: 5,
      doors: 4,
      transmission: "automatic",
      fuelType: "petrol",
      luggage: 3,
      yearFrom: 2024,
      yearTo: 2020,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects missing class and blank make/model", () => {
    const parsed = vehicleModelSchema.safeParse({
      vehicleClassId: "not-a-uuid",
      make: " ",
      model: "",
      description: "Sedan",
      seats: 5,
      doors: 4,
      transmission: "automatic",
      fuelType: "petrol",
      luggage: 3,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("imported vehicle specifications", () => {
  function base(overrides: Record<string, unknown> = {}) {
    return {
      vehicleClassId: classId,
      make: "Toyota",
      model: "Corolla",
      description: "Compact sedan or similar.",
      seats: 5,
      doors: 4,
      transmission: "automatic",
      fuelType: "petrol",
      luggage: 3,
      ...overrides,
    };
  }

  it("keeps blank imported fields null rather than zero", () => {
    const parsed = vehicleModelSchema.parse(
      base({
        generation: "",
        trimLevel: "  ",
        powerKw: "",
        lengthMm: "",
        evRangeKm: "",
        customFields: "",
      }),
    );

    expect(parsed.generation).toBeNull();
    expect(parsed.trimLevel).toBeNull();
    expect(parsed.powerKw).toBeNull();
    expect(parsed.lengthMm).toBeNull();
    expect(parsed.evRangeKm).toBeNull();
    expect(parsed.customFields).toEqual([]);
    expect(parsed.externalProvider).toBeNull();
  });

  it("accepts a full imported specification with custom fields", () => {
    const parsed = vehicleModelSchema.parse(
      base({
        fuelType: "electric",
        generation: "Highland",
        trimLevel: "Long Range",
        bodyType: "sedan",
        engineDisplacementL: "0.0",
        powerKw: "208",
        torqueNm: "420",
        driveType: "AWD",
        lengthMm: "4720",
        batteryCapacityKwh: "79",
        usableBatteryKwh: "75",
        evRangeKm: "629",
        dcChargingKw: "250",
        customFields: JSON.stringify([
          { label: "Boot space", value: "594 L", showPublicly: true },
        ]),
        externalProvider: "cardatabase",
        externalVehicleId: "tesla/model_3_2024",
      }),
    );

    expect(parsed.powerKw).toBe(208);
    expect(parsed.usableBatteryKwh).toBe(75);
    expect(parsed.externalVehicleId).toBe("tesla/model_3_2024");
    expect(parsed.customFields).toEqual([
      { label: "Boot space", value: "594 L", showPublicly: true },
    ]);
    // A zero-litre engine is not a real displacement, so it is discarded.
    expect(parsed.engineDisplacementL).toBeNull();
  });

  it("rejects usable battery larger than total capacity", () => {
    const parsed = vehicleModelSchema.safeParse(
      base({ batteryCapacityKwh: 60, usableBatteryKwh: 75 }),
    );

    expect(parsed.success).toBe(false);
  });

  it("rejects half-recorded provenance and unknown providers", () => {
    expect(
      vehicleModelSchema.safeParse(base({ externalProvider: "cardatabase" }))
        .success,
    ).toBe(false);
    expect(
      vehicleModelSchema.safeParse(
        base({ externalVehicleId: "tesla/model_3_2024" }),
      ).success,
    ).toBe(false);
    expect(
      vehicleModelSchema.safeParse(
        base({
          externalProvider: "some-scraper",
          externalVehicleId: "tesla/model_3_2024",
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects a provider reference that is not a plain brand/model slug", () => {
    expect(
      vehicleModelSchema.safeParse(
        base({
          externalProvider: "cardatabase",
          externalVehicleId: "https://cardatabase.dev/api/v1/models/tesla",
        }),
      ).success,
    ).toBe(false);
    expect(
      vehicleModelSchema.safeParse(
        base({
          externalProvider: "cardatabase",
          externalVehicleId: "../../secrets",
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects implausible imported measurements", () => {
    expect(vehicleModelSchema.safeParse(base({ powerKw: 9000 })).success).toBe(
      false,
    );
    expect(vehicleModelSchema.safeParse(base({ lengthMm: 40 })).success).toBe(
      false,
    );
    expect(vehicleModelSchema.safeParse(base({ cylinders: 40 })).success).toBe(
      false,
    );
  });
});
