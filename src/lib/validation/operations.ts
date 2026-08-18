import { z } from "zod";

import {
  fuelLevelEnum,
  inspectionConditionEnum,
  inspectionPhotoCategoryEnum,
  inspectionTypeEnum,
  maintenanceTypeEnum,
  securityDepositCollectionMethodEnum,
} from "@/lib/db/schema/enums";

const fuelLevels = fuelLevelEnum.enumValues;
const conditions = inspectionConditionEnum.enumValues;
const inspectionTypes = inspectionTypeEnum.enumValues;
const photoCategories = inspectionPhotoCategoryEnum.enumValues;
const depositMethods = securityDepositCollectionMethodEnum.enumValues;
const maintenanceTypes = maintenanceTypeEnum.enumValues;

export const bookingIdSchema = z.object({
  bookingId: z.string().uuid("Choose a valid booking."),
});

export const pickupChecklistSchema = bookingIdSchema.extend({
  identityChecked: z.boolean(),
  licenceChecked: z.boolean(),
  vehicleConditionChecked: z.boolean(),
  fuelChecked: z.boolean(),
  odometerChecked: z.boolean(),
  customerBriefed: z.boolean(),
  securityDepositRecorded: z.boolean(),
});

export const securityDepositCollectionSchema = bookingIdSchema.extend({
  collectedAmountGhs: z.string().trim().min(1, "Enter the collected amount."),
  collectionMethod: z.enum(depositMethods, {
    message: "Choose a collection method.",
  }),
  referenceNote: z.string().trim().max(200).optional(),
  staffNotes: z.string().trim().max(1000).optional(),
});

export const securityDepositReleaseSchema = bookingIdSchema.extend({
  staffNotes: z.string().trim().max(1000).optional(),
});

export const securityDepositRetainSchema = bookingIdSchema.extend({
  reason: z.string().trim().min(1, "Enter a retention reason.").max(500),
  staffNotes: z.string().trim().max(1000).optional(),
});

export const inspectionDraftSchema = bookingIdSchema.extend({
  inspectionType: z.enum(inspectionTypes),
  odometer: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  fuelLevel: z.enum(fuelLevels).optional(),
  generalCondition: z.enum(conditions).optional(),
  damageSummary: z.string().trim().max(2000).optional(),
  maintenanceRequired: z.boolean().default(false),
  staffNotes: z.string().trim().max(2000).optional(),
});

export const inspectionCompleteSchema = inspectionDraftSchema.extend({
  odometer: z
    .string()
    .trim()
    .min(1, "Odometer is required.")
    .refine((value) => /^\d+$/.test(value), "Odometer must be a whole number."),
  fuelLevel: z.enum(fuelLevels, { message: "Choose a fuel level." }),
  generalCondition: z.enum(conditions, { message: "Choose a condition." }),
});

export const inspectionPhotoSchema = z.object({
  bookingId: z.string().uuid(),
  inspectionType: z.enum(inspectionTypes),
  category: z.enum(photoCategories, { message: "Choose a photo category." }),
  caption: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).max(100).default(0),
});

export const maintenanceRecordSchema = z.object({
  vehicleId: z.string().uuid("Choose a vehicle."),
  maintenanceType: z.enum(maintenanceTypes, { message: "Choose a maintenance type." }),
  title: z.string().trim().min(1, "Enter a title.").max(120),
  description: z.string().trim().max(2000).optional(),
  startDate: z.string().trim().min(1, "Enter a start date."),
  startTime: z.string().trim().min(1, "Enter a start time."),
  endDate: z.string().trim().min(1, "Enter an end date."),
  endTime: z.string().trim().min(1, "Enter an end time."),
  odometerAtStart: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  costGhs: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  providerName: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const maintenanceIdSchema = z.object({
  maintenanceId: z.string().uuid("Choose a valid maintenance record."),
});

export function parseOptionalInteger(value: string | undefined, label: string) {
  if (value === undefined) {
    return undefined;
  }
  if (!/^\d+$/.test(value)) {
    throw new Error(`${label} must be a whole number.`);
  }
  return Number.parseInt(value, 10);
}
