import { z } from "zod";

import { isValidSlug, requireSlug } from "@/lib/fleet/slug";
import { fuelTypeSchema, transmissionSchema } from "@/lib/validation/vehicle-class";
import { vehicleCustomFieldsJsonSchema } from "@/lib/validation/vehicle-custom-fields";

/** Providers whose data may be recorded as the source of a model. */
export const VEHICLE_DATA_PROVIDERS = ["cardatabase"] as const;

const providerReferenceSchema = z
  .string()
  .trim()
  .max(120)
  .regex(
    /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/,
    "That vehicle database reference is not valid.",
  );

function optionalText(max: number) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().max(max).optional(),
  );
}

function optionalInt(min: number, max: number) {
  return z.preprocess(
    zeroToUndefined,
    z.coerce.number().int().min(min).max(max).optional(),
  );
}

function optionalDecimal(min: number, max: number) {
  return z.preprocess(
    zeroToUndefined,
    z.coerce.number().min(min).max(max).optional(),
  );
}

export const vehicleModelInputSchema = z
  .object({
    vehicleClassId: z.string().uuid("Choose a vehicle class."),
    make: z.string().trim().min(1, "Make is required.").max(80),
    model: z.string().trim().min(1, "Model is required.").max(80),
    slug: z
      .string()
      .trim()
      .max(80)
      .optional()
      .transform((value) => value ?? ""),
    yearFrom: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1990).max(2100).optional(),
    ),
    yearTo: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1990).max(2100).optional(),
    ),
    description: z.string().trim().min(1, "Description is required.").max(4000),
    seats: z.coerce.number().int().min(1).max(20),
    doors: z.coerce.number().int().min(1).max(8),
    transmission: transmissionSchema,
    fuelType: fuelTypeSchema,
    luggage: z.coerce.number().int().min(0).max(30),
    airConditioning: z.boolean().default(true),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),

    // Imported specifications. Units are fixed by the field name; a blank input
    // stays blank rather than being guessed.
    generation: optionalText(80),
    trimLevel: optionalText(80),
    bodyType: optionalText(60),
    engineName: optionalText(120),
    engineDisplacementL: optionalDecimal(0.1, 20),
    cylinders: optionalInt(1, 16),
    powerKw: optionalDecimal(1, 2000),
    torqueNm: optionalInt(1, 5000),
    driveType: optionalText(40),
    lengthMm: optionalInt(1000, 25000),
    widthMm: optionalInt(1000, 3500),
    heightMm: optionalInt(800, 5000),
    wheelbaseMm: optionalInt(1000, 12000),
    fuelEconomyLPer100Km: optionalDecimal(0.1, 100),
    batteryCapacityKwh: optionalDecimal(0.1, 500),
    usableBatteryKwh: optionalDecimal(0.1, 500),
    evRangeKm: optionalInt(1, 2000),
    acChargingKw: optionalDecimal(0.1, 100),
    dcChargingKw: optionalDecimal(0.1, 1000),

    customFields: vehicleCustomFieldsJsonSchema,

    externalProvider: z.preprocess(
      emptyToUndefined,
      z.enum(VEHICLE_DATA_PROVIDERS).optional(),
    ),
    externalVehicleId: z.preprocess(
      emptyToUndefined,
      providerReferenceSchema.optional(),
    ),
  })
  .superRefine((value, ctx) => {
    if (
      typeof value.yearFrom === "number" &&
      typeof value.yearTo === "number" &&
      value.yearTo < value.yearFrom
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["yearTo"],
        message: "Year to cannot be earlier than year from.",
      });
    }

    if (
      typeof value.batteryCapacityKwh === "number" &&
      typeof value.usableBatteryKwh === "number" &&
      value.usableBatteryKwh > value.batteryCapacityKwh
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["usableBatteryKwh"],
        message: "Usable battery cannot exceed total battery capacity.",
      });
    }

    if (Boolean(value.externalProvider) !== Boolean(value.externalVehicleId)) {
      ctx.addIssue({
        code: "custom",
        path: ["externalVehicleId"],
        message: "Vehicle database provenance is incomplete.",
      });
    }
  });

export const vehicleModelSchema = vehicleModelInputSchema.transform((value) => {
  const slug = requireSlug(value.slug, `${value.make} ${value.model}`);
  if (!isValidSlug(slug)) {
    throw new Error("Slug may only contain lowercase letters, numbers, and hyphens.");
  }

  const {
    generation,
    trimLevel,
    bodyType,
    engineName,
    engineDisplacementL,
    cylinders,
    powerKw,
    torqueNm,
    driveType,
    lengthMm,
    widthMm,
    heightMm,
    wheelbaseMm,
    fuelEconomyLPer100Km,
    batteryCapacityKwh,
    usableBatteryKwh,
    evRangeKm,
    acChargingKw,
    dcChargingKw,
    externalProvider,
    externalVehicleId,
    ...rest
  } = value;

  return {
    ...rest,
    slug,
    yearFrom: value.yearFrom ?? null,
    yearTo: value.yearTo ?? null,
    generation: generation ?? null,
    trimLevel: trimLevel ?? null,
    bodyType: bodyType ?? null,
    engineName: engineName ?? null,
    engineDisplacementL: engineDisplacementL ?? null,
    cylinders: cylinders ?? null,
    powerKw: powerKw ?? null,
    torqueNm: torqueNm ?? null,
    driveType: driveType ?? null,
    lengthMm: lengthMm ?? null,
    widthMm: widthMm ?? null,
    heightMm: heightMm ?? null,
    wheelbaseMm: wheelbaseMm ?? null,
    fuelEconomyLPer100Km: fuelEconomyLPer100Km ?? null,
    batteryCapacityKwh: batteryCapacityKwh ?? null,
    usableBatteryKwh: usableBatteryKwh ?? null,
    evRangeKm: evRangeKm ?? null,
    acChargingKw: acChargingKw ?? null,
    dcChargingKw: dcChargingKw ?? null,
    externalProvider: externalProvider ?? null,
    externalVehicleId: externalVehicleId ?? null,
  };
});

export const vehicleModelContentSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(4000),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export type VehicleModelValues = z.output<typeof vehicleModelSchema>;

function emptyToUndefined(value: unknown) {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    // A whitespace-only input is a blank field, not an empty string to store.
    return value.trim() === "" ? undefined : value;
  }

  return value;
}

/**
 * Every imported measurement here is strictly positive, so a zero means the
 * provider had nothing to report. Treat it as blank rather than failing the
 * whole save — CarDatabase returns 0 for, say, engine displacement on an EV.
 */
function zeroToUndefined(value: unknown) {
  const normalized = emptyToUndefined(value);

  if (normalized === undefined) {
    return undefined;
  }

  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric === 0 ? undefined : normalized;
}
