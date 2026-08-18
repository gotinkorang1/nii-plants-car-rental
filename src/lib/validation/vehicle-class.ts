import { z } from "zod";

import { ghsInputToPesewas } from "@/lib/money";
import { isValidSlug, requireSlug } from "@/lib/fleet/slug";

export const transmissionSchema = z.enum(["automatic", "manual"]);
export const fuelTypeSchema = z.enum(["petrol", "diesel", "hybrid", "electric"]);
export const vehicleStatusSchema = z.enum([
  "available",
  "rented",
  "maintenance",
  "inactive",
]);

const ghsAmountSchema = z
  .string()
  .trim()
  .min(1, "Enter an amount in GHS.")
  .transform((value, ctx) => {
    try {
      return ghsInputToPesewas(value);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "Enter a valid GHS amount with up to two decimal places.",
      });
      return z.NEVER;
    }
  });

export const vehicleClassInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  slug: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value ?? ""),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  seats: z.coerce.number().int().min(1).max(20),
  luggage: z.coerce.number().int().min(0).max(30),
  transmission: transmissionSchema,
  defaultDailyRateGhs: ghsAmountSchema,
  defaultSecurityDepositGhs: ghsAmountSchema,
  active: z.boolean().default(true),
});

export const vehicleClassSchema = vehicleClassInputSchema.transform(
  (value) => {
    const slug = requireSlug(value.slug, value.name);
    if (!isValidSlug(slug)) {
      throw new Error("Slug may only contain lowercase letters, numbers, and hyphens.");
    }

    return {
      name: value.name,
      slug,
      description: value.description,
      seats: value.seats,
      luggage: value.luggage,
      transmission: value.transmission,
      defaultDailyRate: value.defaultDailyRateGhs,
      defaultSecurityDeposit: value.defaultSecurityDepositGhs,
      active: value.active,
    };
  },
);

export type VehicleClassInput = z.input<typeof vehicleClassInputSchema>;
export type VehicleClassValues = z.output<typeof vehicleClassSchema>;
