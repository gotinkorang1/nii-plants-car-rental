import type { VehicleDataDetail } from "./types";

/**
 * The shape the admin form consumes. Deliberately separate from
 * `VehicleDataDetail` so the browser never sees provider URLs or raw provider
 * field names, and so nothing here can be confused with a saved record.
 *
 * Every value is a suggestion: staff can edit all of it before saving, and
 * Nii Plants business fields (class, rates, deposit, description, luggage,
 * published, featured) are never part of this payload.
 */
export type VehicleImportFields = {
  make: string;
  model: string;
  yearFrom: number | null;
  yearTo: number | null;
  generation: string | null;
  trimLevel: string | null;
  bodyType: string | null;

  engineName: string | null;
  engineDisplacementL: number | null;
  cylinders: number | null;
  fuelType: "petrol" | "diesel" | "hybrid" | "electric" | null;

  powerKw: number | null;
  torqueNm: number | null;

  transmission: "automatic" | "manual" | null;
  driveType: string | null;

  doors: number | null;
  seats: number | null;

  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  wheelbaseMm: number | null;

  fuelEconomyLPer100Km: number | null;

  batteryCapacityKwh: number | null;
  usableBatteryKwh: number | null;
  evRangeKm: number | null;
  acChargingKw: number | null;
  dcChargingKw: number | null;
  evConnectors: string[];
};

export type VehicleImportImage = {
  providerImageId: string;
  /** Same-origin admin proxy. The provider URL needs a server-side key. */
  previewUrl: string;
  width: number | null;
  height: number | null;
  angle: string | null;
  isPrimary: boolean;
};

export type VehicleImportDuplicate = {
  id: string;
  slug: string;
  make: string;
  model: string;
  yearFrom: number | null;
  trimLevel: string | null;
  published: boolean;
};

export type VehicleImportPayload = {
  provider: string;
  providerId: string;
  label: string;
  fields: VehicleImportFields;
  images: VehicleImportImage[];
  /** False when image redistribution has not been enabled for this provider. */
  imageImportEnabled: boolean;
  duplicates: VehicleImportDuplicate[];
};

export function buildImagePreviewUrl(
  providerId: string,
  providerImageId: string,
): string {
  const params = new URLSearchParams({
    vehicle: providerId,
    image: providerImageId,
  });
  return `/api/admin/vehicle-data/image?${params.toString()}`;
}

export function toVehicleImportFields(
  detail: VehicleDataDetail,
): VehicleImportFields {
  const ev = detail.ev;

  return {
    make: detail.make,
    model: detail.model,
    // Provider records are per model year, so both bounds are that year.
    yearFrom: detail.year,
    yearTo: detail.year,
    generation: detail.generation,
    trimLevel: detail.trim,
    bodyType: detail.bodyType,

    engineName: detail.engineName,
    engineDisplacementL: detail.engineDisplacementL,
    cylinders: detail.cylinders,
    fuelType: detail.fuelType,

    powerKw: detail.powerKw,
    torqueNm: detail.torqueNm,

    transmission: detail.transmission,
    driveType: detail.driveType,

    doors: detail.doors,
    seats: detail.seats,

    lengthMm: detail.dimensions.lengthMm,
    widthMm: detail.dimensions.widthMm,
    heightMm: detail.dimensions.heightMm,
    wheelbaseMm: detail.dimensions.wheelbaseMm,

    fuelEconomyLPer100Km: detail.fuelEconomyLPer100Km,

    batteryCapacityKwh: ev?.batteryKwhGross ?? null,
    usableBatteryKwh: ev?.batteryKwhUsable ?? null,
    evRangeKm: ev?.rangeKm ?? null,
    acChargingKw: ev?.acChargingKw ?? null,
    dcChargingKw: ev?.dcChargingKw ?? null,
    evConnectors: ev?.connectors ?? [],
  };
}

export function toVehicleImportImages(
  detail: VehicleDataDetail,
): VehicleImportImage[] {
  return detail.images.map((image) => ({
    providerImageId: image.providerImageId,
    previewUrl: buildImagePreviewUrl(detail.providerId, image.providerImageId),
    width: image.width,
    height: image.height,
    angle: image.angle,
    isPrimary: image.isPrimary,
  }));
}
