export type PublicVehicleImage = {
  id: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
  url: string | null;
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
  ].filter((key) => key in record);

  if (leaked.length > 0) {
    throw new Error(
      `Public fleet data must not include internal vehicle fields: ${leaked.join(", ")}`,
    );
  }
}
