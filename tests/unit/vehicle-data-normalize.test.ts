import { describe, expect, it } from "vitest";

import {
  normalizeDetail,
  normalizeSuggestions,
  parseProviderId,
} from "@/lib/vehicle-data/cardatabase";
import {
  buildSuggestionDetail,
  buildSuggestionLabel,
  hpToKw,
  kwToHp,
  normalizeConnectors,
  normalizeFuelType,
  normalizeTransmission,
  toMillimetres,
} from "@/lib/vehicle-data/normalize";

const ORIGIN = "https://cardatabase.dev";

describe("provider reference parsing", () => {
  it("accepts brand/model slugs and rejects anything else", () => {
    expect(parseProviderId("porsche/taycan_2024")).toEqual({
      brandSlug: "porsche",
      modelSlug: "taycan_2024",
    });
    expect(parseProviderId("mercedes-benz/c_class_2023")).not.toBeNull();

    expect(parseProviderId("porsche")).toBeNull();
    expect(parseProviderId("porsche/taycan/2024")).toBeNull();
    expect(parseProviderId("../../etc/passwd")).toBeNull();
    expect(parseProviderId("porsche/tay can")).toBeNull();
    expect(parseProviderId("")).toBeNull();
  });
});

describe("unit normalization", () => {
  it("converts horsepower to kW and back", () => {
    expect(hpToKw(140)).toBeCloseTo(103, 0);
    expect(kwToHp(103)).toBe(140);
  });

  it("uses a declared length unit when the provider gives one", () => {
    expect(toMillimetres(4630, "length", "mm")).toBe(4630);
    expect(toMillimetres(4.63, "length", "m")).toBe(4630);
    expect(toMillimetres(463, "length", "cm")).toBe(4630);
  });

  it("infers a plausible unit and drops values it cannot place", () => {
    expect(toMillimetres(4630, "length")).toBe(4630);
    expect(toMillimetres(4.63, "length")).toBe(4630);
    // A saloon is never 40 metres long, so the value is dropped rather than stored.
    expect(toMillimetres(40000, "length")).toBeNull();
    expect(toMillimetres(0, "length")).toBeNull();
    expect(toMillimetres("unknown", "length")).toBeNull();
  });

  it("maps transmission labels onto the rental enum", () => {
    expect(normalizeTransmission("CVT automatic")).toBe("automatic");
    expect(normalizeTransmission("8-speed automatic")).toBe("automatic");
    expect(normalizeTransmission("single-speed")).toBe("automatic");
    expect(normalizeTransmission("7-speed DCT")).toBe("automatic");
    expect(normalizeTransmission("6-speed manual")).toBe("manual");
    expect(normalizeTransmission("sequential")).toBeNull();
    expect(normalizeTransmission(null)).toBeNull();
  });

  it("treats plug-in hybrids as hybrid, not electric", () => {
    expect(normalizeFuelType("Plug-in Hybrid Electric")).toBe("hybrid");
    expect(normalizeFuelType("PHEV")).toBe("hybrid");
    expect(normalizeFuelType("MHEV")).toBe("hybrid");
    expect(normalizeFuelType("electric")).toBe("electric");
    expect(normalizeFuelType("bev")).toBe("electric");
    expect(normalizeFuelType("Diesel")).toBe("diesel");
    expect(normalizeFuelType("gasoline")).toBe("petrol");
    expect(normalizeFuelType("hydrogen")).toBeNull();
    expect(normalizeFuelType("", { isEv: true })).toBe("electric");
  });

  it("builds readable suggestion lines", () => {
    expect(
      buildSuggestionLabel({
        make: "Toyota",
        model: "Corolla",
        year: 2022,
        trim: "LE",
      }),
    ).toBe("2022 Toyota Corolla LE");

    expect(
      buildSuggestionLabel({ make: "Toyota", model: "Corolla", year: null }),
    ).toBe("Toyota Corolla");

    expect(buildSuggestionDetail(["sedan", "electric", null])).toBe(
      "Sedan · Electric",
    );
  });

  it("deduplicates connectors and tolerates a single value", () => {
    expect(normalizeConnectors(["CCS2", "CCS2", "Type 2"])).toEqual([
      "CCS2",
      "Type 2",
    ]);
    expect(normalizeConnectors("CCS2")).toEqual(["CCS2"]);
    expect(normalizeConnectors(null)).toEqual([]);
  });
});

describe("suggestion normalization", () => {
  it("builds a provider reference from make and model slugs", () => {
    const results = normalizeSuggestions([
      {
        id: 220,
        code: "i4_2025_m50",
        make_slug: "bmw",
        make_name: "BMW",
        model_name: "i4 M50",
        year: 2025,
        body_type: "sedan",
        fuel_type: "electric",
        is_ev: 1,
      },
    ]);

    expect(results).toEqual([
      {
        providerId: "bmw/i4_2025_m50",
        make: "BMW",
        model: "i4 M50",
        year: 2025,
        trim: null,
        bodyType: "sedan",
        fuelType: "electric",
        label: "2025 BMW i4 M50",
      },
    ]);
  });

  it("skips entries that cannot be turned into a usable reference", () => {
    expect(
      normalizeSuggestions([
        { make_slug: "bmw", model_name: "i4" },
        { code: "i4_2025", model_name: "i4" },
        { make_slug: "bmw", code: "i4 2025", make_name: "BMW", model_name: "i4" },
        "nonsense",
      ]),
    ).toEqual([]);

    expect(normalizeSuggestions(null)).toEqual([]);
  });
});

describe("vehicle detail normalization", () => {
  it("merges the model and specs payloads into canonical units", () => {
    const detail = normalizeDetail(
      "toyota/corolla_2022",
      {
        code: "corolla_2022",
        make_slug: "toyota",
        make_name: "Toyota",
        model_name: "Corolla",
        year: 2022,
        generation: "E210",
        trim: "LE",
        body_type: "sedan",
        fuel_type: "petrol",
        is_ev: 0,
        doors: 4,
        seats: 5,
        length_mm: 4630,
        width_mm: 1780,
        height_mm: 1435,
        wheelbase_mm: 2700,
      },
      {
        specs: {
          engine: "1.8 L 4-cylinder",
          engine_displacement_cc: 1798,
          cylinders: 4,
          horsepower: 140,
          torque_nm: 177,
          transmission: "CVT automatic",
          drivetrain: "FWD",
          fuel_economy_l_100km: 6.1,
        },
      },
      ORIGIN,
    );

    expect(detail.make).toBe("Toyota");
    expect(detail.year).toBe(2022);
    expect(detail.generation).toBe("E210");
    expect(detail.trim).toBe("LE");
    expect(detail.engineDisplacementL).toBe(1.8);
    expect(detail.transmission).toBe("automatic");
    expect(detail.driveType).toBe("FWD");
    expect(detail.dimensions).toEqual({
      lengthMm: 4630,
      widthMm: 1780,
      heightMm: 1435,
      wheelbaseMm: 2700,
    });
    // Only horsepower was supplied, so kW is derived rather than invented.
    expect(detail.powerHp).toBe(140);
    expect(detail.powerKw).toBeCloseTo(103, 0);
    expect(detail.ev).toBeNull();
  });

  it("normalizes the EV block and derives kWh/100km from Wh/km", () => {
    const detail = normalizeDetail(
      "porsche/taycan_2024",
      {
        make_slug: "porsche",
        make_name: "Porsche",
        model_name: "Taycan",
        year: 2024,
        is_ev: 1,
        fuel_type: "electric",
        ev: {
          battery_kwh_net: 71,
          battery_kwh_gross: 79.2,
          consumption_wh_km: 196,
          range_wltp_km: 431,
          max_dc_kw: 270,
          max_ac_kw: 11,
          connectors: ["CCS2"],
        },
      },
      null,
      ORIGIN,
    );

    expect(detail.fuelType).toBe("electric");
    expect(detail.ev).toEqual({
      batteryKwhGross: 79.2,
      batteryKwhUsable: 71,
      rangeKm: 431,
      acChargingKw: 11,
      dcChargingKw: 270,
      consumptionKwhPer100Km: 19.6,
      connectors: ["CCS2"],
    });
  });

  it("leaves missing values null instead of guessing", () => {
    const detail = normalizeDetail(
      "toyota/corolla_2022",
      { make_name: "Toyota", model_name: "Corolla" },
      null,
      ORIGIN,
    );

    expect(detail.year).toBeNull();
    expect(detail.trim).toBeNull();
    expect(detail.seats).toBeNull();
    expect(detail.doors).toBeNull();
    expect(detail.powerKw).toBeNull();
    expect(detail.transmission).toBeNull();
    expect(detail.fuelType).toBeNull();
    expect(detail.dimensions).toEqual({
      lengthMm: null,
      widthMm: null,
      heightMm: null,
      wheelbaseMm: null,
    });
    expect(detail.ev).toBeNull();
    expect(detail.images).toEqual([]);
  });

  it("keeps only https image URLs on the configured provider host", () => {
    const detail = normalizeDetail(
      "toyota/corolla_2022",
      {
        make_name: "Toyota",
        model_name: "Corolla",
        logo: "http://cardatabase.dev/images/logos/toyota-logo.svg",
        images: [
          {
            public_id: "aaaa1111bbbb2222",
            url: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
            width: 1920,
            height: 1080,
            mime_type: "image/webp",
            is_primary: 1,
            angles: [{ angle_type: "front" }],
          },
          {
            public_id: "cccc3333dddd4444",
            url: "https://evil.example.com/steal",
          },
          {
            public_id: "not a hex id",
            url: "https://cardatabase.dev/api/v1/images/x/file",
          },
        ],
      },
      null,
      ORIGIN,
    );

    expect(detail.images).toHaveLength(1);
    expect(detail.images[0]).toMatchObject({
      providerImageId: "aaaa1111bbbb2222",
      angle: "front",
      isPrimary: true,
    });
    // Plain http is refused even on the right host.
    expect(detail.brandLogoUrl).toBeNull();
  });
});
