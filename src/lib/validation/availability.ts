import { z } from "zod";

import { BookingError } from "@/lib/booking/errors";
import {
  accraDateTimeToUtc,
  isValidClockTime,
  isValidIsoDate,
} from "@/lib/booking/timezone";
import { MAX_EXTRA_QUANTITY } from "@/lib/pricing/calculate-extras";

const dateField = z
  .string()
  .trim()
  .min(1, "Choose a date.")
  .refine(isValidIsoDate, "Enter a valid date.");

const timeField = z
  .string()
  .trim()
  .min(1, "Choose a time.")
  .refine(isValidClockTime, "Enter a valid time.");

export const extraSelectionSchema = z.object({
  extraId: z.string().uuid("Choose a valid extra."),
  quantity: z.coerce
    .number()
    .int("Extra quantity must be a whole number.")
    .min(1, "Extra quantity must be at least 1.")
    .max(MAX_EXTRA_QUANTITY, `Extra quantity cannot exceed ${MAX_EXTRA_QUANTITY}.`),
});

export const availabilitySearchInputSchema = z.object({
  pickupLocation: z.string().trim().min(1, "Choose a pickup location."),
  returnLocation: z.string().trim().optional(),
  pickupDate: dateField,
  pickupTime: timeField,
  returnDate: dateField,
  returnTime: timeField,
  vehicle: z.string().trim().optional(),
});

export const availabilitySearchSchema = availabilitySearchInputSchema.transform(
  (value, ctx) => {
    const pickupAt = accraDateTimeToUtc(value.pickupDate, value.pickupTime);
    const returnAt = accraDateTimeToUtc(value.returnDate, value.returnTime);
    const returnLocation =
      value.returnLocation && value.returnLocation.length > 0
        ? value.returnLocation
        : value.pickupLocation;

    if (pickupAt.getTime() >= returnAt.getTime()) {
      ctx.addIssue({
        code: "custom",
        path: ["returnDate"],
        message: "Return must be after pickup.",
      });
      return z.NEVER;
    }

    return {
      pickupLocation: value.pickupLocation,
      returnLocation,
      pickupDate: value.pickupDate,
      pickupTime: value.pickupTime,
      returnDate: value.returnDate,
      returnTime: value.returnTime,
      vehicle: value.vehicle || undefined,
      pickupAt,
      returnAt,
    };
  },
);

export const quoteRequestSchema = availabilitySearchInputSchema
  .extend({
    modelSlug: z.string().trim().min(1, "Choose a vehicle."),
    promoCode: z.string().trim().optional(),
    extras: z.array(extraSelectionSchema).default([]),
  })
  .transform((value, ctx) => {
    const search = availabilitySearchSchema.safeParse(value);
    if (!search.success) {
      ctx.addIssue({
        code: "custom",
        message: search.error.issues[0]?.message ?? "Check the trip details.",
      });
      return z.NEVER;
    }

    const extras = value.extras ?? [];
    const extraIds = extras.map((item) => item.extraId);
    if (new Set(extraIds).size !== extraIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["extras"],
        message: "Each extra may only be selected once.",
      });
      return z.NEVER;
    }

    return {
      ...search.data,
      modelSlug: value.modelSlug,
      promoCode: value.promoCode?.trim() ? value.promoCode.trim() : undefined,
      extras,
    };
  });

export type AvailabilitySearchInput = z.input<typeof availabilitySearchInputSchema>;
export type AvailabilitySearchValues = z.output<typeof availabilitySearchSchema>;
export type QuoteRequestValues = z.output<typeof quoteRequestSchema>;

export function assertPickupNotInPast(pickupAt: Date, now = new Date()): void {
  if (pickupAt.getTime() < now.getTime()) {
    throw new BookingError("PICKUP_IN_PAST", "Pickup cannot be in the past.");
  }
}

export function assertMinimumDuration(
  pickupAt: Date,
  returnAt: Date,
  minimumRentalHours: number,
): void {
  if (!Number.isInteger(minimumRentalHours) || minimumRentalHours < 1) {
    throw new Error("minimumRentalHours must be a positive integer.");
  }

  const minimumMs = minimumRentalHours * 60 * 60 * 1000;
  if (returnAt.getTime() - pickupAt.getTime() < minimumMs) {
    throw new BookingError(
      "DURATION_TOO_SHORT",
      `Standard self-drive rentals require at least ${minimumRentalHours} hours.`,
    );
  }
}

export const promoCodeSchema = z.object({
  code: z.string().trim().min(1, "Enter a promo code.").max(40),
});

export const extraInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  description: z.string().trim().min(1, "Description is required.").max(2000),
  priceGhs: z.string().trim().min(1, "Enter an amount in GHS."),
  pricingType: z.enum(["once", "per_day"]),
  active: z.boolean().default(true),
});

export const promotionInputSchema = z
  .object({
    code: z.string().trim().min(1, "Code is required.").max(40),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().int().min(0),
    active: z.boolean().default(false),
    startsAt: z.string().min(1, "Start date is required."),
    endsAt: z.string().min(1, "End date is required."),
    maxUses: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "percentage" && (value.value < 0 || value.value > 100)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Percentage promotions must be between 0 and 100.",
      });
    }
  });

export const manualBlockInputSchema = z.object({
  vehicleId: z.string().uuid("Choose a vehicle."),
  reason: z.string().trim().min(1, "Reason is required.").max(500),
});
