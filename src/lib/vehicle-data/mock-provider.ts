import "server-only";

import { buildSuggestionLabel } from "./normalize";
import {
  VehicleDataError,
  type VehicleDataDetail,
  type VehicleDataProvider,
  type VehicleDataSuggestion,
} from "./types";

/**
 * Deterministic in-memory provider used by CI and local development.
 *
 * Enabled with `CARDATABASE_MOCK=1` so end-to-end tests exercise the real
 * routes, form population and image import without spending provider quota.
 * Production start-up refuses to run with the mock enabled.
 */
export const MOCK_PROVIDER_NAME = "cardatabase";

/** 1x1 PNG. Passes the same magic-byte validation as a real download. */
const MOCK_IMAGE_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

const MOCK_VEHICLES: VehicleDataDetail[] = [
  {
    providerId: "toyota/corolla_2022",
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    generation: "E210",
    trim: "LE",
    bodyType: "sedan",
    engineName: "1.8 L 4-cylinder",
    engineDisplacementL: 1.8,
    cylinders: 4,
    fuelType: "petrol",
    fuelLabel: "petrol",
    powerKw: 103,
    powerHp: 140,
    torqueNm: 177,
    transmission: "automatic",
    transmissionLabel: "CVT automatic",
    driveType: "FWD",
    doors: 4,
    seats: 5,
    dimensions: {
      lengthMm: 4630,
      widthMm: 1780,
      heightMm: 1435,
      wheelbaseMm: 2700,
    },
    fuelEconomyLPer100Km: 6.1,
    ev: null,
    brandLogoUrl: null,
    images: [
      {
        providerImageId: "aaaa1111bbbb2222",
        url: "https://cardatabase.dev/api/v1/images/aaaa1111bbbb2222/file",
        width: 1920,
        height: 1080,
        mimeType: "image/png",
        angle: "front-quarter",
        isPrimary: true,
      },
      {
        providerImageId: "cccc3333dddd4444",
        url: "https://cardatabase.dev/api/v1/images/cccc3333dddd4444/file",
        width: 1920,
        height: 1080,
        mimeType: "image/png",
        angle: "side",
        isPrimary: false,
      },
    ],
  },
  {
    providerId: "toyota/corolla_2021",
    make: "Toyota",
    model: "Corolla",
    year: 2021,
    generation: "E210",
    trim: "L",
    bodyType: "sedan",
    engineName: "1.8 L 4-cylinder",
    engineDisplacementL: 1.8,
    cylinders: 4,
    fuelType: "petrol",
    fuelLabel: "petrol",
    powerKw: 100,
    powerHp: 136,
    torqueNm: 172,
    transmission: "automatic",
    transmissionLabel: "CVT automatic",
    driveType: "FWD",
    doors: 4,
    seats: 5,
    dimensions: {
      lengthMm: 4630,
      widthMm: 1780,
      heightMm: 1435,
      wheelbaseMm: 2700,
    },
    fuelEconomyLPer100Km: 6.3,
    ev: null,
    brandLogoUrl: null,
    images: [],
  },
  {
    providerId: "toyota/corolla_cross_2023",
    make: "Toyota",
    model: "Corolla Cross",
    year: 2023,
    generation: null,
    trim: "XLE",
    bodyType: "suv",
    engineName: "2.0 L 4-cylinder",
    engineDisplacementL: 2,
    cylinders: 4,
    fuelType: "petrol",
    fuelLabel: "petrol",
    powerKw: 125,
    powerHp: 170,
    torqueNm: 205,
    transmission: "automatic",
    transmissionLabel: "CVT automatic",
    driveType: "AWD",
    doors: 5,
    seats: 5,
    dimensions: {
      lengthMm: 4460,
      widthMm: 1825,
      heightMm: 1620,
      wheelbaseMm: 2640,
    },
    fuelEconomyLPer100Km: 6.9,
    ev: null,
    brandLogoUrl: null,
    images: [],
  },
  {
    providerId: "tesla/model_3_2024",
    make: "Tesla",
    model: "Model 3",
    year: 2024,
    generation: "Highland",
    trim: "Long Range",
    bodyType: "sedan",
    engineName: null,
    engineDisplacementL: null,
    cylinders: null,
    fuelType: "electric",
    fuelLabel: "electric",
    powerKw: 208,
    powerHp: 283,
    torqueNm: 420,
    transmission: "automatic",
    transmissionLabel: "single-speed",
    driveType: "AWD",
    doors: 4,
    seats: 5,
    dimensions: {
      lengthMm: 4720,
      widthMm: 1849,
      heightMm: 1441,
      wheelbaseMm: 2875,
    },
    fuelEconomyLPer100Km: null,
    ev: {
      batteryKwhGross: 79,
      batteryKwhUsable: 75,
      rangeKm: 629,
      acChargingKw: 11,
      dcChargingKw: 250,
      consumptionKwhPer100Km: 13.2,
      connectors: ["CCS2"],
    },
    brandLogoUrl: null,
    images: [
      {
        providerImageId: "eeee5555ffff6666",
        url: "https://cardatabase.dev/api/v1/images/eeee5555ffff6666/file",
        width: 1920,
        height: 1080,
        mimeType: "image/png",
        angle: "front",
        isPrimary: true,
      },
    ],
  },
];

function toSuggestion(vehicle: VehicleDataDetail): VehicleDataSuggestion {
  return {
    providerId: vehicle.providerId,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    trim: vehicle.trim,
    bodyType: vehicle.bodyType,
    fuelType: vehicle.fuelLabel,
    label: buildSuggestionLabel({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      trim: vehicle.trim,
    }),
  };
}

export function isVehicleDataMockEnabled(): boolean {
  return process.env.CARDATABASE_MOCK === "1";
}

export function createMockVehicleDataProvider(): VehicleDataProvider {
  return {
    name: MOCK_PROVIDER_NAME,

    async search(query) {
      const needle = query.trim().toLowerCase();
      return MOCK_VEHICLES.filter((vehicle) =>
        `${vehicle.make} ${vehicle.model} ${vehicle.year ?? ""}`
          .toLowerCase()
          .includes(needle),
      ).map(toSuggestion);
    },

    async getVehicle(providerId) {
      const vehicle = MOCK_VEHICLES.find(
        (entry) => entry.providerId === providerId,
      );

      if (!vehicle) {
        throw new VehicleDataError(
          "not_found",
          "That vehicle was not found in the vehicle database.",
        );
      }

      return vehicle;
    },

    async downloadImage(providerId, providerImageId) {
      const vehicle = MOCK_VEHICLES.find(
        (entry) => entry.providerId === providerId,
      );
      const image = vehicle?.images.find(
        (entry) => entry.providerImageId === providerImageId,
      );

      if (!image) {
        throw new VehicleDataError(
          "invalid_request",
          "That image does not belong to the selected vehicle.",
        );
      }

      return {
        bytes: new Uint8Array(MOCK_IMAGE_BYTES),
        mimeType: "image/png",
        sourceUrl: image.url,
      };
    },
  };
}
