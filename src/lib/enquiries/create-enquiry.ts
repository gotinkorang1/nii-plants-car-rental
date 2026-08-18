import "server-only";

import { and, eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { enquiries, enquiryStatusHistory, vehicleClasses } from "@/lib/db/schema";
import type { enquirySourceEnum } from "@/lib/db/schema/enums";
import { EnquiryError } from "@/lib/enquiries/errors";
import { generateEnquiryReference } from "@/lib/enquiries/generate-enquiry-reference";
import { assertEnquiryRateLimit, assertHoneypotClear } from "@/lib/enquiries/rate-limit";
import {
  auditEnquiryEvent,
} from "@/lib/enquiries/transition-enquiry-status";
import {
  normalizePublicEnquiryInput,
  parseEnquiryDate,
  validatePublicEnquiryPayload,
  type PublicEnquiryInput,
} from "@/lib/enquiries/validation";
import { isUniqueViolation } from "@/lib/fleet/action-helpers";
import { log } from "@/lib/logger";

type EnquirySource = (typeof enquirySourceEnum.enumValues)[number];

export type CreatePublicEnquiryResult = {
  reference: string;
  serviceType: PublicEnquiryInput["serviceType"];
};

async function assertActiveVehicleClass(vehicleClassId: string | undefined) {
  if (!vehicleClassId) {
    return;
  }
  const db = tryGetDb();
  if (!db) {
    return;
  }
  const [row] = await db
    .select({ id: vehicleClasses.id })
    .from(vehicleClasses)
    .where(and(eq(vehicleClasses.id, vehicleClassId), eq(vehicleClasses.active, true)))
    .limit(1);
  if (!row?.id) {
    throw new EnquiryError("VALIDATION_FAILED", "Choose a valid vehicle class.");
  }
}

export async function createPublicEnquiry(
  payload: unknown,
): Promise<CreatePublicEnquiryResult> {
  const parsed = validatePublicEnquiryPayload(payload);
  if (!parsed.success) {
    throw new EnquiryError(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ?? "Check the form and try again.",
    );
  }

  const input = normalizePublicEnquiryInput(parsed.data as PublicEnquiryInput);
  assertHoneypotClear(input.companyWebsite);
  await assertEnquiryRateLimit(input.email);
  await assertActiveVehicleClass(input.vehicleClassId);

  const db = tryGetDb();
  if (!db) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiries are not configured yet.");
  }

  let reference = generateEnquiryReference();
  let createdId: string | undefined;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      createdId = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(enquiries)
          .values({
            reference,
            serviceType: input.serviceType,
            status: "new",
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            phone: input.phone,
            companyName: input.companyName ?? null,
            pickupLocationText: input.pickupLocationText ?? null,
            returnLocationText: input.returnLocationText ?? null,
            pickupAt: parseEnquiryDate(input.pickupAt) ?? null,
            returnAt: parseEnquiryDate(input.returnAt) ?? null,
            passengerCount: input.passengerCount ?? null,
            vehicleClassId: input.vehicleClassId ?? null,
            customerMessage: input.customerMessage ?? null,
            serviceDetails: input.serviceDetails ?? {},
            source: "website",
          })
          .returning({ id: enquiries.id });

        if (!row) {
          throw new EnquiryError("NOT_CONFIGURED", "Enquiry could not be saved.");
        }

        await tx.insert(enquiryStatusHistory).values({
          enquiryId: row.id,
          fromStatus: null,
          toStatus: "new",
          actorType: "customer",
          actorId: null,
        });

        return row.id;
      });
      break;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 4) {
        reference = generateEnquiryReference();
        continue;
      }
      throw error;
    }
  }

  if (!createdId) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiry could not be saved.");
  }

  await auditEnquiryEvent({
    action: "enquiry_received",
    enquiryId: createdId,
    metadata: { serviceType: input.serviceType, source: "website" },
  });

  log("info", "enquiry_received", {
    enquiryId: createdId,
    reference,
    serviceType: input.serviceType,
  });

  const { notifyEnquiryReceived } = await import("@/lib/enquiries/notify");
  await notifyEnquiryReceived(createdId);

  return { reference, serviceType: input.serviceType };
}

export type CreateStaffEnquiryInput = {
  staffId: string;
  payload: unknown;
  source: EnquirySource;
};

export async function createStaffEnquiry(input: CreateStaffEnquiryInput) {
  const { staffEnquirySchema, parseEnquiryDate } = await import(
    "@/lib/enquiries/validation"
  );
  const parsed = staffEnquirySchema.safeParse(input.payload);
  if (!parsed.success) {
    throw new EnquiryError(
      "VALIDATION_FAILED",
      parsed.error.issues[0]?.message ?? "Check the enquiry details.",
    );
  }

  const data = parsed.data;
  await assertActiveVehicleClass(data.vehicleClassId);

  const db = tryGetDb();
  if (!db) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiries are not configured yet.");
  }

  let reference = generateEnquiryReference();
  let createdId: string | undefined;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      createdId = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(enquiries)
          .values({
            reference,
            serviceType: data.serviceType,
            status: "new",
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone.trim(),
            companyName: data.companyName ?? null,
            pickupLocationText: data.pickupLocationText ?? null,
            returnLocationText: data.returnLocationText ?? null,
            pickupAt: parseEnquiryDate(data.pickupAt) ?? null,
            returnAt: parseEnquiryDate(data.returnAt) ?? null,
            passengerCount: data.passengerCount ?? null,
            vehicleClassId: data.vehicleClassId ?? null,
            customerMessage: data.customerMessage ?? null,
            serviceDetails: data.serviceDetails ?? {},
            source: input.source,
          })
          .returning({ id: enquiries.id });

        if (!row) {
          throw new EnquiryError("NOT_CONFIGURED", "Enquiry could not be saved.");
        }

        await tx.insert(enquiryStatusHistory).values({
          enquiryId: row.id,
          fromStatus: null,
          toStatus: "new",
          actorType: "staff",
          actorId: input.staffId,
        });

        return row.id;
      });
      break;
    } catch (error) {
      if (isUniqueViolation(error) && attempt < 4) {
        reference = generateEnquiryReference();
        continue;
      }
      throw error;
    }
  }

  if (!createdId) {
    throw new EnquiryError("NOT_CONFIGURED", "Enquiry could not be saved.");
  }

  await auditEnquiryEvent({
    staffId: input.staffId,
    action: "enquiry_created_by_staff",
    enquiryId: createdId,
    metadata: { source: input.source, serviceType: parsed.data.serviceType },
  });

  return { id: createdId, reference };
}
