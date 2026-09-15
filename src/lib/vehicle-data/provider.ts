import "server-only";

import { serverEnv } from "@/lib/env.server";

import {
  CARDATABASE_DEFAULT_BASE_URL,
  CARDATABASE_PROVIDER_NAME,
  createCarDatabaseProvider,
} from "./cardatabase";
import {
  createMockVehicleDataProvider,
  isVehicleDataMockEnabled,
} from "./mock-provider";
import type { VehicleDataProvider } from "./types";

export { CARDATABASE_PROVIDER_NAME };

let cached: VehicleDataProvider | null | undefined;

/**
 * Returns the configured provider, or null when no API key is present.
 *
 * A null provider is a supported state: the lookup UI hides itself and manual
 * vehicle creation continues to work.
 */
export function getVehicleDataProvider(): VehicleDataProvider | null {
  if (cached !== undefined) {
    return cached;
  }

  if (isVehicleDataMockEnabled()) {
    cached = createMockVehicleDataProvider();
    return cached;
  }

  const apiKey = serverEnv.CARDATABASE_API_KEY;
  if (!apiKey) {
    cached = null;
    return cached;
  }

  try {
    cached = createCarDatabaseProvider({
      apiKey,
      baseUrl: serverEnv.CARDATABASE_BASE_URL ?? CARDATABASE_DEFAULT_BASE_URL,
    });
  } catch {
    cached = null;
  }

  return cached;
}

export function isVehicleDataConfigured(): boolean {
  return getVehicleDataProvider() !== null;
}

/**
 * Copying provider images into our own storage is redistribution. CarDatabase
 * publishes no licence or terms document, so this stays off until an operator
 * confirms the rights in writing. See docs/VEHICLE_DATA_IMPORT.md.
 */
export function isVehicleImageImportEnabled(): boolean {
  const flag = serverEnv.CARDATABASE_IMAGE_IMPORT_ENABLED?.toLowerCase();
  return flag === "1" || flag === "true";
}

/** Test seam: forces the next call to re-read the environment. */
export function resetVehicleDataProviderCache(): void {
  cached = undefined;
}
