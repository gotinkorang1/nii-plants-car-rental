import "server-only";

import { eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import {
  bookings,
  rentalPickupChecklists,
  securityDeposits,
} from "@/lib/db/schema";
import type {
  securityDepositCollectionMethodEnum,
  securityDepositStatusEnum,
} from "@/lib/db/schema/enums";
import { auditOperationsEvent } from "@/lib/operations/audit";
import { OperationsError } from "@/lib/operations/errors";
import {
  ensurePickupChecklist,
  ensureSecurityDepositRecord,
} from "@/lib/operations/prepare-booking";
import { lockOperationalBooking } from "@/lib/operations/allocation-transitions";

type DepositStatus = (typeof securityDepositStatusEnum.enumValues)[number];
type CollectionMethod = (typeof securityDepositCollectionMethodEnum.enumValues)[number];

export async function savePickupChecklist(input: {
  bookingId: string;
  staffId: string;
  identityChecked: boolean;
  licenceChecked: boolean;
  vehicleConditionChecked: boolean;
  fuelChecked: boolean;
  odometerChecked: boolean;
  customerBriefed: boolean;
  securityDepositRecorded: boolean;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking || !["confirmed", "ready"].includes(booking.status)) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Pickup checklist is not available for this booking.",
      );
    }

    await ensurePickupChecklist(tx, booking.id);

    await tx
      .update(rentalPickupChecklists)
      .set({
        identityChecked: input.identityChecked,
        licenceChecked: input.licenceChecked,
        vehicleConditionChecked: input.vehicleConditionChecked,
        fuelChecked: input.fuelChecked,
        odometerChecked: input.odometerChecked,
        customerBriefed: input.customerBriefed,
        securityDepositRecorded: input.securityDepositRecorded,
        updatedBy: input.staffId,
      })
      .where(eq(rentalPickupChecklists.bookingId, booking.id));
  });
}

function deriveDepositStatus(required: number, collected: number): DepositStatus {
  if (required <= 0) {
    return "not_required";
  }
  if (collected <= 0) {
    return "required";
  }
  if (collected < required) {
    return "partially_collected";
  }
  return "collected";
}

export async function recordSecurityDepositCollection(input: {
  bookingId: string;
  staffId: string;
  collectedAmount: number;
  collectionMethod: CollectionMethod;
  referenceNote?: string | null;
  staffNotes?: string | null;
}) {
  if (input.collectedAmount < 0) {
    throw new OperationsError(
      "INVALID_STATUS_TRANSITION",
      "Collected amount cannot be negative.",
    );
  }

  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  let depositId: string | null = null;

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }

    const deposit = await ensureSecurityDepositRecord(tx, booking, input.staffId);
    if (input.collectedAmount > deposit.requiredAmount) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Collected amount cannot exceed the required deposit.",
      );
    }

    const status = deriveDepositStatus(deposit.requiredAmount, input.collectedAmount);
    const [updated] = await tx
      .update(securityDeposits)
      .set({
        collectedAmount: input.collectedAmount,
        collectionMethod: input.collectionMethod,
        status,
        collectedAt: input.collectedAmount > 0 ? new Date() : deposit.collectedAt,
        referenceNote: input.referenceNote ?? deposit.referenceNote,
        staffNotes: input.staffNotes ?? deposit.staffNotes,
        recordedBy: input.staffId,
      })
      .where(eq(securityDeposits.id, deposit.id))
      .returning({ id: securityDeposits.id });

    depositId = updated?.id ?? null;

    await ensurePickupChecklist(tx, booking.id);
    if (input.collectedAmount > 0 || deposit.requiredAmount <= 0) {
      await tx
        .update(rentalPickupChecklists)
        .set({ securityDepositRecorded: true, updatedBy: input.staffId })
        .where(eq(rentalPickupChecklists.bookingId, booking.id));
    }
  });

  if (depositId) {
    await auditOperationsEvent({
      staffId: input.staffId,
      action: "security_deposit_recorded",
      entityType: "security_deposit",
      entityId: depositId,
      metadata: { bookingId: input.bookingId },
    });
  }
}

export async function releaseSecurityDeposit(input: {
  bookingId: string;
  staffId: string;
  staffNotes?: string | null;
}) {
  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }

    const [deposit] = await tx
      .select()
      .from(securityDeposits)
      .where(eq(securityDeposits.bookingId, booking.id))
      .limit(1);

    if (!deposit) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Security deposit record was not found.",
      );
    }

    await tx
      .update(securityDeposits)
      .set({
        status: "released",
        releasedAt: new Date(),
        staffNotes: input.staffNotes ?? deposit.staffNotes,
        recordedBy: input.staffId,
      })
      .where(eq(securityDeposits.id, deposit.id));
  });

  await auditOperationsEvent({
    staffId: input.staffId,
    action: "security_deposit_released",
    entityType: "security_deposit",
    entityId: input.bookingId,
    metadata: { bookingId: input.bookingId },
  });
}

export async function retainSecurityDeposit(input: {
  bookingId: string;
  staffId: string;
  reason: string;
  staffNotes?: string | null;
}) {
  if (!input.reason.trim()) {
    throw new OperationsError("INVALID_STATUS_TRANSITION", "Retention reason is required.");
  }

  const db = tryGetDb();
  if (!db) {
    throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
  }

  await db.transaction(async (tx) => {
    const booking = await lockOperationalBooking(tx, input.bookingId);
    if (!booking) {
      throw new OperationsError("BOOKING_NOT_FOUND", "That booking was not found.");
    }

    const [deposit] = await tx
      .select()
      .from(securityDeposits)
      .where(eq(securityDeposits.bookingId, booking.id))
      .limit(1);

    if (!deposit) {
      throw new OperationsError(
        "INVALID_STATUS_TRANSITION",
        "Security deposit record was not found.",
      );
    }

    await tx
      .update(securityDeposits)
      .set({
        status: "retained",
        retentionReason: input.reason.trim(),
        staffNotes: input.staffNotes ?? deposit.staffNotes,
        recordedBy: input.staffId,
      })
      .where(eq(securityDeposits.id, deposit.id));
  });

  await auditOperationsEvent({
    staffId: input.staffId,
    action: "security_deposit_retained",
    entityType: "security_deposit",
    entityId: input.bookingId,
    metadata: { bookingId: input.bookingId, reason: input.reason.trim() },
  });
}

export async function getCustomerDepositSummary(bookingId: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select({
      booking: bookings,
      deposit: securityDeposits,
    })
    .from(bookings)
    .leftJoin(securityDeposits, eq(securityDeposits.bookingId, bookings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row) {
    return null;
  }

  const required = row.booking.securityDepositRequired;
  const status = row.deposit?.status ?? (required <= 0 ? "not_required" : "required");

  return {
    requiredAmount: required,
    status,
    label:
      status === "not_required"
        ? "No refundable security deposit required"
        : status === "released"
          ? "Security deposit released"
          : ["collected", "held", "partially_collected", "retained"].includes(status)
            ? "Security deposit recorded"
            : "Refundable security deposit required",
  };
}
