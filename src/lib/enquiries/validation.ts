import { z } from "zod";

import {
  ENQUIRY_SERVICE_TYPES,
  type EnquiryServiceType,
} from "@/lib/enquiries/status";
import { normalizeEmail, normalizePersonName, normalizePhone } from "@/lib/bookings/normalize-customer";

const nameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name.")
  .max(80, "Name is too long.");

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254);

const phoneSchema = z
  .string()
  .trim()
  .min(6, "Enter a phone number.")
  .max(30, "Phone number is too long.");

const messageSchema = z
  .string()
  .trim()
  .max(4000, "Message is too long.")
  .optional()
  .transform((value) => value || undefined);

const passengerCountSchema = z.coerce
  .number()
  .int("Passenger count must be a whole number.")
  .min(1, "At least one passenger is required.")
  .max(500, "Passenger count is too high.");

const vehicleClassIdSchema = z
  .string()
  .uuid("Choose a valid vehicle class.")
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : undefined));

const preferredContactMethodSchema = z.enum(["email", "phone", "whatsapp"]).optional();

function parseOptionalDate(value: string | undefined, label: string) {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new z.ZodError([
      {
        code: "custom",
        message: `Enter a valid ${label}.`,
        path: [],
      },
    ]);
  }
  return parsed;
}

function assertNotUnreasonablyPast(date: Date, label: string) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  if (date.getTime() < cutoff.getTime()) {
    throw new z.ZodError([
      {
        code: "custom",
        message: `${label} cannot be more than 24 hours in the past.`,
        path: [],
      },
    ]);
  }
}

const serviceTypeSchema = z.enum(ENQUIRY_SERVICE_TYPES);

export const publicEnquiryBaseSchema = z.object({
  serviceType: serviceTypeSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  customerMessage: messageSchema,
  vehicleClassId: vehicleClassIdSchema,
  preferredContactMethod: preferredContactMethodSchema,
  companyWebsite: z.string().max(0).optional(),
  pickupLocationText: z.string().trim().max(300).optional(),
  returnLocationText: z.string().trim().max(300).optional(),
  pickupAt: z.string().optional(),
  returnAt: z.string().optional(),
  passengerCount: z.coerce.number().optional(),
  companyName: z.string().trim().max(160).optional(),
  serviceDetails: z.record(z.string(), z.unknown()).optional(),
});

export type PublicEnquiryInput = z.infer<typeof publicEnquiryBaseSchema>;

function withDateRules<T extends z.ZodTypeAny>(schema: T, requirePickup = false) {
  return schema.superRefine((input, ctx) => {
    const values = input as { pickupAt?: string; returnAt?: string };
    let pickup: Date | undefined;
    let returnAt: Date | undefined;

    try {
      pickup = parseOptionalDate(values.pickupAt, "pickup date/time");
      returnAt = parseOptionalDate(values.returnAt, "return date/time");
    } catch (error) {
      if (error instanceof z.ZodError) {
        for (const issue of error.issues) {
          ctx.addIssue({ ...issue, path: ["pickupAt"] });
        }
      }
      return;
    }

    if (requirePickup && !pickup) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a pickup date and time.",
        path: ["pickupAt"],
      });
    }

    if (pickup) {
      try {
        assertNotUnreasonablyPast(pickup, "Pickup time");
      } catch (error) {
        if (error instanceof z.ZodError) {
          ctx.addIssue({ code: "custom", message: error.issues[0]!.message, path: ["pickupAt"] });
        }
      }
    }

    if (pickup && returnAt && pickup >= returnAt) {
      ctx.addIssue({
        code: "custom",
        message: "Return time must be after pickup time.",
        path: ["returnAt"],
      });
    }
  });
}

export const chauffeurEnquirySchema = withDateRules(
  publicEnquiryBaseSchema.extend({
    serviceType: z.literal("chauffeur"),
    pickupLocationText: z.string().trim().min(1, "Enter a pickup location.").max(300),
    returnLocationText: z.string().trim().max(300).optional(),
    passengerCount: passengerCountSchema,
  }),
  true,
);

export const airportTransferEnquirySchema = withDateRules(
  publicEnquiryBaseSchema.extend({
    serviceType: z.literal("airport_transfer"),
    pickupLocationText: z.string().trim().min(1, "Enter a pickup or destination.").max(300),
    returnLocationText: z.string().trim().max(300).optional(),
    passengerCount: passengerCountSchema,
    serviceDetails: z
      .object({
        transferDirection: z.enum(["airport_to_destination", "destination_to_airport"]),
        flightNumber: z.string().trim().max(20).optional(),
        luggageNotes: z.string().trim().max(500).optional(),
      })
      .passthrough(),
  }),
  true,
);

export const longTermEnquirySchema = withDateRules(
  publicEnquiryBaseSchema.extend({
    serviceType: z.literal("long_term"),
    passengerCount: z.coerce.number().optional(),
    serviceDetails: z
      .object({
        intendedUse: z.string().trim().max(500).optional(),
        rentalPeriod: z.string().trim().max(200).optional(),
      })
      .passthrough(),
  }),
  true,
);

export const corporateEnquirySchema = publicEnquiryBaseSchema.extend({
  serviceType: z.literal("corporate"),
  companyName: z.string().trim().min(1, "Enter your company name.").max(160),
  serviceDetails: z
    .object({
      serviceRequirement: z.enum([
        "corporate_transport",
        "airport_movement",
        "executive_transport",
        "long_term",
        "events",
        "other",
      ]),
      estimatedTravellers: z.coerce.number().int().min(1).max(500).optional(),
    })
    .passthrough(),
});

export const eventsEnquirySchema = withDateRules(
  publicEnquiryBaseSchema.extend({
    serviceType: z.literal("events"),
    pickupLocationText: z.string().trim().min(1, "Enter a pickup location.").max(300),
    returnLocationText: z.string().trim().min(1, "Enter a destination or venue.").max(300),
    passengerCount: passengerCountSchema,
    serviceDetails: z
      .object({
        eventType: z.enum([
          "wedding",
          "corporate_event",
          "group_transport",
          "special_event",
          "other",
        ]),
        vehicleCount: z.coerce.number().int().min(1).max(50).optional(),
      })
      .passthrough(),
  }),
  true,
);

export const multiCityEnquirySchema = withDateRules(
  publicEnquiryBaseSchema.extend({
    serviceType: z.literal("multi_city"),
    pickupLocationText: z.string().trim().min(1, "Enter a starting location.").max(300),
    passengerCount: passengerCountSchema.optional(),
    serviceDetails: z
      .object({
        destinations: z.string().trim().min(1, "Describe your destinations.").max(1000),
      })
      .passthrough(),
  }),
  true,
);

export const generalEnquirySchema = publicEnquiryBaseSchema.extend({
  serviceType: z.literal("general"),
});

const schemaByService: Record<EnquiryServiceType, z.ZodTypeAny> = {
  chauffeur: chauffeurEnquirySchema,
  airport_transfer: airportTransferEnquirySchema,
  long_term: longTermEnquirySchema,
  corporate: corporateEnquirySchema,
  events: eventsEnquirySchema,
  multi_city: multiCityEnquirySchema,
  general: generalEnquirySchema,
};

export function validatePublicEnquiryPayload(payload: unknown) {
  const base = publicEnquiryBaseSchema.safeParse(payload);
  if (!base.success) {
    return base;
  }

  const schema = schemaByService[base.data.serviceType];
  return schema.safeParse(payload);
}

export function normalizePublicEnquiryInput(input: PublicEnquiryInput) {
  return {
    ...input,
    firstName: normalizePersonName(input.firstName),
    lastName: normalizePersonName(input.lastName),
    email: normalizeEmail(input.email),
    phone: normalizePhone(input.phone),
    companyName: input.companyName?.trim() || undefined,
    pickupLocationText: input.pickupLocationText?.trim() || undefined,
    returnLocationText: input.returnLocationText?.trim() || undefined,
    customerMessage: input.customerMessage?.trim() || undefined,
  };
}

export const staffEnquirySchema = z.object({
  serviceType: serviceTypeSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  companyName: z.string().trim().max(160).optional(),
  pickupLocationText: z.string().trim().max(300).optional(),
  returnLocationText: z.string().trim().max(300).optional(),
  pickupAt: z.string().optional(),
  returnAt: z.string().optional(),
  passengerCount: z.coerce.number().int().min(1).max(500).optional(),
  vehicleClassId: vehicleClassIdSchema,
  customerMessage: messageSchema,
  source: z.enum(["phone", "whatsapp", "walk_in", "other", "admin"]),
  serviceDetails: z.record(z.string(), z.unknown()).optional(),
});

export const enquiryQuoteSchema = z.object({
  enquiryId: z.string().uuid(),
  quotedAmountGhs: z.string().trim().min(1, "Enter a quoted amount."),
  quoteNotes: z.string().trim().max(4000).optional(),
  quoteValidUntil: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

export const assignEnquirySchema = z.object({
  enquiryId: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
});

export const enquiryStatusActionSchema = z.object({
  enquiryId: z.string().uuid(),
  toStatus: z.enum([
    "in_review",
    "contacted",
    "awaiting_customer",
    "quoted",
    "accepted",
    "declined",
    "closed",
  ]),
  reason: z.string().trim().max(1000).optional(),
});

export const enquiryNotesSchema = z.object({
  enquiryId: z.string().uuid(),
  internalNotes: z.string().trim().max(8000),
});

export function parseEnquiryDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed;
}
