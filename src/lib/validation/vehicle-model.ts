import { z } from "zod";

import { fuelTypeSchema, transmissionSchema } from "@/lib/validation/vehicle-class";
import { isValidSlug, requireSlug } from "@/lib/fleet/slug";

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
  });

export const vehicleModelSchema = vehicleModelInputSchema.transform((value) => {
  const slug = requireSlug(value.slug, `${value.make} ${value.model}`);
  if (!isValidSlug(slug)) {
    throw new Error("Slug may only contain lowercase letters, numbers, and hyphens.");
  }

  return {
    ...value,
    slug,
    yearFrom: value.yearFrom ?? null,
    yearTo: value.yearTo ?? null,
  };
});

export const vehicleModelContentSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(4000),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
});

export type VehicleModelValues = z.output<typeof vehicleModelSchema>;

function emptyToUndefined(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  return value;
}
