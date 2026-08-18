import "server-only";

import { eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { rentalInspections } from "@/lib/db/schema";
import type {
  fuelLevelEnum,
  inspectionConditionEnum,
  inspectionTypeEnum,
} from "@/lib/db/schema/enums";
import { OperationsError } from "@/lib/operations/errors";
import { auditOperationsEvent } from "@/lib/operations/audit";
import { assertVehicleAssignment } from "@/lib/operations/booking-guards";
import {
  ensurePickupChecklist,
  ensureSecurityDepositRecord,
} from "@/lib/operations/prepare-booking";
import {
  lockOperationalAllocation,
  lockOperationalBooking,
} from "@/lib/operations/allocation-transitions";
import { log } from "@/lib/logger";

type InspectionType = (typeof inspectionTypeEnum.enumValues)[number];
type FuelLevel = (typeof fuelLevelEnum.enumValues)[number];
type InspectionCondition = (typeof inspectionConditionEnum.enumValues)[number];

export type SaveInspectionDraftInput = {
  bookingId: string;
  staffId: string;
  inspectionType: InspectionType;
  odometer?: number;
  fuelLevel?: FuelLevel;
  generalCondition?: InspectionCondition;
  damageSummary?: string | null;
  maintenanceRequired?: boolean;
  staffNotes?: string | null;
};

function validateOdometer(value: number | undefined, label: string) {
  if (value === undefined || value === null) {
    return;
  }
  if (!Number.isInteger(value) || value < 0) {
    throw new OperationsError(
      "INVALID_STATUS_TRANSITION",
      `${label} must be a whole number of kilometres.`,
    );
  }
}

export async function saveInspectionDraft(input: SaveInspectionDraftInput) {
  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  validateOdometer(input.odometer, "Odometer");

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking?.vehicleId) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }

    const allocation = await lockOperationalAllocation(tx, booking.vehicleAllocationId);
    await assertVehicleAssignment(booking, allocation);

    if (input.inspectionType === "pickup" && !["confirmed", "ready"].includes(booking.status)) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Pickup inspection is not available for this booking status.",
      );
    }
    if (input.inspectionType === "return" && booking.status !== "checked_out") {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Return inspection is not available for this booking status.",
      );
    }

    const [existing] = await tx
      .select()
      .from(rentalInspections)
      .where(eq(rentalInspections.bookingId, booking.id))
      .limit(1);

    const match = existing?.inspectionType === input.inspectionType ? existing : null;

    if (match?.completedAt) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "This inspection is already completed.",
      );
    }

    const values = {
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      inspectionType: input.inspectionType,
      odometer: input.odometer ?? null,
      fuelLevel: input.fuelLevel ?? null,
      generalCondition: input.generalCondition ?? null,
      damageSummary: input.damageSummary ?? null,
      maintenanceRequired: input.maintenanceRequired ?? false,
      staffNotes: input.staffNotes ?? null,
    };

    if (match) {
      await tx
        .update(rentalInspections)
        .set(values)
        .where(eq(rentalInspections.id, match.id));
    } else {
      await tx.insert(rentalInspections).values(values);
    }

    if (input.inspectionType === "pickup") {
      await ensurePickupChecklist(tx, booking.id);
      await ensureSecurityDepositRecord(tx, booking, input.staffId);
    }
  });

  log("info", input.inspectionType === "pickup" ? "pickup_started" : "return_started", {
    bookingId: input.bookingId,
  });
}

export async function completeInspection(input: SaveInspectionDraftInput) {
  validateOdometer(input.odometer, "Odometer");
  if (input.odometer === undefined) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "Odometer is required.");
  }
  if (!input.fuelLevel) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "Fuel level is required.");
  }
  if (!input.generalCondition) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "General condition is required.");
  }
  if (input.generalCondition === "damage_detected" && !input.damageSummary?.trim()) {
    throw new OperationsError(
      "INVALID_STATUS_TRANSITION",
      "Damage summary is required when damage is detected.",
    );
  }

  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  let inspectionId: string | null = null;

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking?.vehicleId) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }

    const allocation = await lockOperationalAllocation(tx, booking.vehicleAllocationId);
    await assertVehicleAssignment(booking, allocation);

    if (input.inspectionType === "return") {
      const completedPickup = await tx
        .select()
        .from(rentalInspections)
        .where(eq(rentalInspections.bookingId, booking.id));

      const pickupDone = completedPickup.find(
        (row) => row.inspectionType === "pickup" && row.completedAt,
      );
      if (!pickupDone?.odometer) {
        throw new OperationsError(
          "INVALID_STATUS_TRANSITION",
          "Pickup odometer is required before completing return.",
        );
      }
      if (input.odometer !== undefined && input.odometer < pickupDone.odometer) {
        throw new OperationsError(
          "INVALID_STATUS_TRANSITION",
          "The return odometer cannot be lower than the pickup odometer.",
        );
      }
    }

    const rows = await tx
      .select()
      .from(rentalInspections)
      .where(eq(rentalInspections.bookingId, booking.id));

    const existing = rows.find((row) => row.inspectionType === input.inspectionType);
    if (existing?.completedAt) {
      inspectionId = existing.id;
      return;
    }

    const now = new Date();
    const payload = {
      bookingId: booking.id,
      vehicleId: booking.vehicleId,
      inspectionType: input.inspectionType,
      odometer: input.odometer,
      fuelLevel: input.fuelLevel,
      generalCondition: input.generalCondition,
      damageSummary: input.damageSummary ?? null,
      maintenanceRequired: input.maintenanceRequired ?? false,
      staffNotes: input.staffNotes ?? null,
      completedBy: input.staffId,
      completedAt: now,
    };

    if (existing) {
      const [updated] = await tx
        .update(rentalInspections)
        .set(payload)
        .where(eq(rentalInspections.id, existing.id))
        .returning({ id: rentalInspections.id });
      inspectionId = updated?.id ?? null;
    } else {
      const [created] = await tx.insert(rentalInspections).values(payload).returning({
        id: rentalInspections.id,
      });
      inspectionId = created?.id ?? null;
    }
  });

  if (inspectionId) {
    await auditOperationsEvent({
      staffId: input.staffId,
      action:
        input.inspectionType === "pickup"
          ? "pickup_inspection_completed"
          : "return_inspection_completed",
      entityType: "rental_inspection",
      entityId: inspectionId,
      metadata: { bookingId: input.bookingId },
    });
  }

  log("info", input.inspectionType === "pickup" ? "pickup_completed" : "return_completed", {
    bookingId: input.bookingId,
  });

  return inspectionId;
}

export function formatDistanceKm(pickupOdometer: number, returnOdometer: number) {
  const distance = returnOdometer - pickupOdometer;
  return `${distance} km`;
}
