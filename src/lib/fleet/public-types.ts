export type PublicVehicleImage = {
  id: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  url: string | null;
};

/** A custom specification a member of staff chose to publish. */
export type PublicVehicleSpec = {
  label: string;
  value: string;
};

export type PublicVehicleModel = {
  id: string;
  slug: string;
  make: string;
  modelName: string;
  description: string;
  seats: number;
  doors: number;
  transmission: "automatic" | "manual";
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  luggage: number;
  airConditioning: boolean;
  featured: boolean;
  yearFrom: number | null;
  yearTo: number | null;
  className: string;
  classSlug: string;
  dailyRatePesewas: number;
  primaryImage: PublicVehicleImage | null;
  images: PublicVehicleImage[];

  // Curated subset of the imported specifications. Dimensions, torque,
  // cylinders and wheelbase are stored but stay admin-only; staff can publish
  // any of them through a custom specification instead.
  bodyType: string | null;
  trimLevel: string | null;
  engineName: string | null;
  engineDisplacementL: number | null;
  powerKw: number | null;
  driveType: string | null;
  fuelEconomyLPer100Km: number | null;
  batteryCapacityKwh: number | null;
  evRangeKm: number | null;
  acChargingKw: number | null;
  dcChargingKw: number | null;

  /** Only rows explicitly marked public. Internal rows never appear here. */
  customSpecs: PublicVehicleSpec[];
};

export const PUBLIC_MODEL_FIELDS = [
  "id",
  "slug",
  "make",
  "model",
  "description",
  "seats",
  "doors",
  "transmission",
  "fuelType",
  "luggage",
  "airConditioning",
  "featured",
  "yearFrom",
  "yearTo",
] as const;

export function assertNoInternalVehicleFields(value: unknown) {
  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  const leaked = [
    "registrationNumber",
    "registration_number",
    "internalCode",
    "internal_code",
    "notes",
    "currentMileage",
    "current_mileage",
    // The raw column would carry rows staff marked internal.
    "customFields",
    "custom_fields",
  ].filter((key) => key in record);

  if (leaked.length > 0) {
    throw new Error(
      `Public fleet data must not include internal vehicle fields: ${leaked.join(", ")}`,
    );
  }

  if (Array.isArray(record.customSpecs)) {
    const privateSpec = record.customSpecs.find(
      (spec) =>
        spec && typeof spec === "object" && "showPublicly" in (spec as object),
    );

    if (privateSpec) {
      throw new Error(
        "Public custom specifications must not carry the showPublicly flag.",
      );
    }
  }
}
