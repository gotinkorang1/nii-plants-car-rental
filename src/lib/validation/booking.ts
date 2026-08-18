import { z } from "zod";

import { normalizeEmail, normalizePhone } from "@/lib/bookings/normalize-customer";

export const customerDetailsSchema = z.object({
  quoteId: z.string().uuid("Choose a valid quote."),
  firstName: z.string().trim().min(1, "Enter a first name.").max(80),
  lastName: z.string().trim().min(1, "Enter a last name.").max(80),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .transform(normalizeEmail),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(20)
    .transform(normalizePhone)
    .refine((value) => /\d{7,}/.test(value), "Enter a valid phone number."),
  driverAge: z.coerce.number().int().min(25, "Drivers must be 25 or older.").max(99),
  licenceCountry: z
    .string()
    .trim()
    .min(2, "Enter the licence country.")
    .max(80)
    .transform((value) => value.toUpperCase()),
  licenceNumber: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((value) => (value && value.length > 0 ? value.toUpperCase() : undefined)),
  customerNotes: z.string().trim().max(1000).optional(),
});

export type CustomerDetailsValues = z.infer<typeof customerDetailsSchema>;

export const bookingAccessRequestSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(6, "Enter the booking reference.")
    .max(20)
    .transform((value) => value.toUpperCase()),
  email: z
    .string()
    .trim()
    .email("Enter the booking email address.")
    .transform(normalizeEmail),
});

export const bookingOtpSchema = z.object({
  reference: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .transform((value) => value.toUpperCase()),
  email: z.string().trim().email().transform(normalizeEmail),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const staffCancelBookingSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().min(3, "Enter a cancellation reason.").max(500),
});

export const staffNotesSchema = z.object({
  bookingId: z.string().uuid(),
  internalNotes: z.string().trim().max(4000),
});
