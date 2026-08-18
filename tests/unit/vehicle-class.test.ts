import { describe, expect, it } from "vitest";

import { slugify, isValidSlug, requireSlug } from "@/lib/fleet/slug";
import { vehicleClassSchema } from "@/lib/validation/vehicle-class";

describe("vehicle class validation", () => {
  it("stores money as integer pesewas from GHS input", () => {
    const parsed = vehicleClassSchema.parse({
      name: "Economy",
      slug: "",
      description: "Compact self-drive class.",
      seats: 4,
      luggage: 2,
      transmission: "automatic",
      defaultDailyRateGhs: "25.50",
      defaultSecurityDepositGhs: "100",
      active: true,
    });

    expect(parsed.slug).toBe("economy");
    expect(parsed.defaultDailyRate).toBe(2550);
    expect(parsed.defaultSecurityDeposit).toBe(10000);
  });

  it("rejects empty names and invalid numeric ranges", () => {
    const emptyName = vehicleClassSchema.safeParse({
      name: "  ",
      description: "Class",
      seats: 4,
      luggage: 2,
      transmission: "automatic",
      defaultDailyRateGhs: "10",
      defaultSecurityDepositGhs: "10",
    });
    const seats = vehicleClassSchema.safeParse({
      name: "Economy",
      description: "Class",
      seats: 0,
      luggage: 2,
      transmission: "automatic",
      defaultDailyRateGhs: "10",
      defaultSecurityDepositGhs: "10",
    });

    expect(emptyName.success).toBe(false);
    expect(seats.success).toBe(false);
  });

  it("rejects floating-point GHS input beyond two decimals", () => {
    const parsed = vehicleClassSchema.safeParse({
      name: "Economy",
      description: "Class",
      seats: 4,
      luggage: 2,
      transmission: "automatic",
      defaultDailyRateGhs: "10.123",
      defaultSecurityDepositGhs: "10",
    });

    expect(parsed.success).toBe(false);
  });

  it("stores optional published USD catalogue rates", () => {
    const parsed = vehicleClassSchema.parse({
      name: "Economy",
      description: "Compact self-drive class.",
      seats: 4,
      luggage: 2,
      transmission: "automatic",
      defaultDailyRateGhs: "715.00",
      defaultSecurityDepositGhs: "1000",
      usdDailyRateFrom: "65",
      usdDailyRateTo: "",
      active: true,
    });

    expect(parsed.usdDailyRateFrom).toBe(65);
    expect(parsed.usdDailyRateTo).toBe(65);
  });

  it("rejects a USD to below USD from", () => {
    const parsed = vehicleClassSchema.safeParse({
      name: "Economy",
      description: "Class",
      seats: 4,
      luggage: 2,
      transmission: "automatic",
      defaultDailyRateGhs: "10",
      defaultSecurityDepositGhs: "10",
      usdDailyRateFrom: "100",
      usdDailyRateTo: "80",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("slug handling", () => {
  it("generates a public slug from a name", () => {
    expect(slugify("Toyota Corolla")).toBe("toyota-corolla");
    expect(isValidSlug("toyota-corolla")).toBe(true);
    expect(requireSlug("", "SUV Class")).toBe("suv-class");
  });

  it("rejects empty slugs without a fallback name", () => {
    expect(() => requireSlug("   ")).toThrow(/slug/i);
  });
});
