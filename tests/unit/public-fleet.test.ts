import { describe, expect, it } from "vitest";

import {
  matchesPublicFleetFilters,
  parseFleetSearchParams,
} from "@/lib/fleet/filters";
import { canEditFleetContent, canManageFleet } from "@/lib/fleet/permissions";
import {
  assertNoInternalVehicleFields,
  type PublicVehicleModel,
} from "@/lib/fleet/public-types";

const publishedAutomatic: Parameters<typeof matchesPublicFleetFilters>[0] = {
  published: true,
  classActive: true,
  classSlug: "compact-sedan",
  seats: 5,
  transmission: "automatic",
  dailyRatePesewas: 25000,
};

describe("public fleet filtering", () => {
  it("excludes unpublished models and inactive classes", () => {
    expect(
      matchesPublicFleetFilters({
        ...publishedAutomatic,
        published: false,
      }),
    ).toBe(false);
    expect(
      matchesPublicFleetFilters({
        ...publishedAutomatic,
        classActive: false,
      }),
    ).toBe(false);
    expect(matchesPublicFleetFilters(publishedAutomatic)).toBe(true);
  });

  it("applies class, seats, transmission, and max price filters", () => {
    expect(
      matchesPublicFleetFilters(publishedAutomatic, { classSlug: "suv" }),
    ).toBe(false);
    expect(
      matchesPublicFleetFilters(publishedAutomatic, { minSeats: 7 }),
    ).toBe(false);
    expect(
      matchesPublicFleetFilters(publishedAutomatic, {
        transmission: "manual",
      }),
    ).toBe(false);
    expect(
      matchesPublicFleetFilters(publishedAutomatic, {
        maxDailyRatePesewas: 20000,
      }),
    ).toBe(false);
    expect(
      matchesPublicFleetFilters(publishedAutomatic, {
        classSlug: "compact-sedan",
        minSeats: 5,
        transmission: "automatic",
        maxDailyRatePesewas: 25000,
      }),
    ).toBe(true);
  });

  it("parses GHS max price search params into pesewas", () => {
    expect(
      parseFleetSearchParams({
        class: "compact-sedan",
        seats: "5",
        transmission: "automatic",
        maxPrice: "250.00",
      }),
    ).toEqual({
      classSlug: "compact-sedan",
      minSeats: 5,
      transmission: "automatic",
      maxDailyRatePesewas: 25000,
      maxPriceGhs: "250.00",
    });
  });
});

describe("public fleet payload safety", () => {
  it("rejects internal physical vehicle fields", () => {
    expect(() =>
      assertNoInternalVehicleFields({
        slug: "hyundai-accent",
        registrationNumber: "GR-0000-00",
      }),
    ).toThrow(/internal vehicle fields/i);

    const publicModel: PublicVehicleModel = {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "hyundai-accent",
      make: "Hyundai",
      modelName: "Accent",
      description: "A compact saloon.",
      seats: 5,
      doors: 4,
      transmission: "automatic",
      fuelType: "petrol",
      luggage: 3,
      airConditioning: true,
      featured: true,
      yearFrom: null,
      yearTo: null,
      className: "Compact sedan",
      classSlug: "compact-sedan",
      dailyRatePesewas: 0,
      primaryImage: null,
      images: [],
    };

    expect(() => assertNoInternalVehicleFields(publicModel)).not.toThrow();
  });
});

describe("fleet RBAC helpers", () => {
  it("gives fleet and administrators write access", () => {
    expect(canManageFleet("administrator")).toBe(true);
    expect(canManageFleet("fleet")).toBe(true);
    expect(canManageFleet("reservations")).toBe(false);
    expect(canManageFleet("finance")).toBe(false);
    expect(canManageFleet("content_editor")).toBe(false);
  });

  it("lets content editors update public model copy and images", () => {
    expect(canEditFleetContent("content_editor")).toBe(true);
    expect(canEditFleetContent("fleet")).toBe(true);
    expect(canEditFleetContent("reservations")).toBe(false);
    expect(canEditFleetContent("finance")).toBe(false);
  });
});
