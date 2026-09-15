/**
 * Provider-agnostic vehicle catalogue data.
 *
 * Nothing outside `src/lib/vehicle-data/` may depend on a specific provider's
 * field names. Adapters translate into these shapes; the rest of the app only
 * ever sees them.
 *
 * Canonical units: power kW, torque Nm, dimensions mm, battery kWh, range km,
 * fuel economy L/100km. A value is `null` when the provider did not supply it.
 */

export const VEHICLE_DATA_FAILURES = [
  "not_configured",
  "invalid_request",
  "not_found",
  "rate_limited",
  "unavailable",
] as const;

export type VehicleDataFailureReason = (typeof VEHICLE_DATA_FAILURES)[number];

export class VehicleDataError extends Error {
  readonly reason: VehicleDataFailureReason;

  constructor(reason: VehicleDataFailureReason, message: string) {
    super(message);
    this.name = "VehicleDataError";
    this.reason = reason;
  }
}

/** Safe subset returned to the browser for autocomplete suggestions. */
export type VehicleDataSuggestion = {
  /** Opaque provider reference. Never used as a local primary key. */
  providerId: string;
  make: string;
  model: string;
  year: number | null;
  trim: string | null;
  bodyType: string | null;
  fuelType: string | null;
  /** Human-readable line for the listbox option. */
  label: string;
};

export type VehicleDataImage = {
  providerImageId: string;
  /** Provider download URL. Requires the server-side API key. */
  url: string;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  angle: string | null;
  isPrimary: boolean;
};

export type VehicleDataEv = {
  batteryKwhGross: number | null;
  batteryKwhUsable: number | null;
  rangeKm: number | null;
  acChargingKw: number | null;
  dcChargingKw: number | null;
  consumptionKwhPer100Km: number | null;
  connectors: string[];
};

export type VehicleDataDimensions = {
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  wheelbaseMm: number | null;
};

export type VehicleDataDetail = {
  providerId: string;
  make: string;
  model: string;
  year: number | null;
  generation: string | null;
  trim: string | null;
  bodyType: string | null;

  engineName: string | null;
  engineDisplacementL: number | null;
  cylinders: number | null;
  /** Already mapped onto the Nii Plants fuel enum, or null when unmappable. */
  fuelType: "petrol" | "diesel" | "hybrid" | "electric" | null;
  /** Raw provider fuel label, kept for display only. */
  fuelLabel: string | null;

  powerKw: number | null;
  powerHp: number | null;
  torqueNm: number | null;

  /** Mapped onto the Nii Plants transmission enum, or null when unmappable. */
  transmission: "automatic" | "manual" | null;
  transmissionLabel: string | null;
  driveType: string | null;

  doors: number | null;
  seats: number | null;

  dimensions: VehicleDataDimensions;
  fuelEconomyLPer100Km: number | null;

  /** Present only for EV/PHEV vehicles. */
  ev: VehicleDataEv | null;

  brandLogoUrl: string | null;
  images: VehicleDataImage[];
};

export type VehicleDataProvider = {
  /** Stable provider key stored as `vehicle_models.external_provider`. */
  readonly name: string;
  search(query: string, signal?: AbortSignal): Promise<VehicleDataSuggestion[]>;
  getVehicle(providerId: string, signal?: AbortSignal): Promise<VehicleDataDetail>;
  /**
   * Downloads an image the provider previously returned for `providerId`.
   * Implementations must reject any URL they did not themselves issue.
   */
  downloadImage(
    providerId: string,
    providerImageId: string,
    signal?: AbortSignal,
  ): Promise<{ bytes: Uint8Array; mimeType: string | null; sourceUrl: string }>;
};
