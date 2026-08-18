import { z } from "zod";

import { vehicleStatusSchema } from "@/lib/validation/vehicle-class";

export const vehicleInputSchema = z.object({
  vehicleModelId: z.string().uuid("Choose a vehicle model."),
  vehicleClassId: z.string().uuid().optional(),
  internalCode: z.string().trim().min(1, "Internal code is required.").max(40),
  registrationNumber: z
    .string()
    .trim()
    .min(1, "Registration number is required.")
    .max(40),
  colour: z.string().trim().min(1, "Colour is required.").max(40),
  currentMileage: z.coerce.number().int().min(0, "Mileage cannot be negative."),
  status: vehicleStatusSchema,
  branchLocationId: z.string().uuid("Choose a branch location."),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => value || null),
});

export const vehicleSchema = vehicleInputSchema;

export type VehicleValues = z.output<typeof vehicleSchema>;
