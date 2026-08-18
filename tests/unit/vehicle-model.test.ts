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
