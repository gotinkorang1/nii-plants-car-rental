"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRoleAction } from "@/lib/auth/require-role";
import { accraDateTimeToUtc } from "@/lib/booking/timezone";
import { tryGetDb } from "@/lib/db";
import { inspectionPhotos, rentalInspections } from "@/lib/db/schema";
import {
  type ActionState,
  formCheckbox,
  formString,
} from "@/lib/fleet/action-helpers";
import {
  cancelMaintenanceRecord,
  completeMaintenanceRecord,
  createMaintenanceRecord,
  startMaintenanceRecord,
} from "@/lib/maintenance/records";
import { checkoutVehicle } from "@/lib/operations/checkout-vehicle";
import { completeRental } from "@/lib/operations/complete-rental";
import { publicOperationsMessage } from "@/lib/operations/errors";
import {
  completeInspection,
  saveInspectionDraft,
} from "@/lib/operations/inspections";
import {
  deleteInspectionPhotoObject,
  uploadInspectionPhoto,
} from "@/lib/operations/inspection-storage";
import { markBookingReady } from "@/lib/operations/prepare-booking";
import {
  MAINTENANCE_MUTATE_ROLES,
  OPERATIONS_MUTATE_ROLES,
  SECURITY_DEPOSIT_MUTATE_ROLES,
} from "@/lib/operations/permissions";
import {
  recordSecurityDepositCollection,
  releaseSecurityDeposit,
  retainSecurityDeposit,
  savePickupChecklist,
} from "@/lib/operations/security-deposit";
import { ghsInputToPesewas } from "@/lib/money";
import {
  bookingIdSchema,
  inspectionCompleteSchema,
  inspectionDraftSchema,
  inspectionPhotoSchema,
  maintenanceIdSchema,
  maintenanceRecordSchema,
  parseOptionalInteger,
  pickupChecklistSchema,
  securityDepositCollectionSchema,
  securityDepositReleaseSchema,
  securityDepositRetainSchema,
} from "@/lib/validation/operations";

function revalidateBookingPaths(bookingId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/admin/bookings/${bookingId}/pickup`);
  revalidatePath(`/admin/bookings/${bookingId}/return`);
  revalidatePath("/admin/operations/rentals");
}

function revalidateMaintenancePaths(maintenanceId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/maintenance");
  if (maintenanceId) {
    revalidatePath(`/admin/maintenance/${maintenanceId}`);
  }
}

export async function markBookingReadyAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const parsed = bookingIdSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  }

  try {
    await markBookingReady({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Vehicle marked ready for pickup." };
}

export async function savePickupChecklistAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const parsed = pickupChecklistSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    identityChecked: formCheckbox(formData, "identityChecked"),
    licenceChecked: formCheckbox(formData, "licenceChecked"),
    vehicleConditionChecked: formCheckbox(formData, "vehicleConditionChecked"),
    fuelChecked: formCheckbox(formData, "fuelChecked"),
    odometerChecked: formCheckbox(formData, "odometerChecked"),
    customerBriefed: formCheckbox(formData, "customerBriefed"),
    securityDepositRecorded: formCheckbox(formData, "securityDepositRecorded"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the checklist." };
  }

  try {
    await savePickupChecklist({
      ...parsed.data,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Pickup checklist saved." };
}

export async function recordSecurityDepositAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(SECURITY_DEPOSIT_MUTATE_ROLES);
  const parsed = securityDepositCollectionSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    collectedAmountGhs: formString(formData, "collectedAmountGhs"),
    collectionMethod: formString(formData, "collectionMethod"),
    referenceNote: formString(formData, "referenceNote") || undefined,
    staffNotes: formString(formData, "staffNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the deposit details." };
  }

  let collectedAmount: number;
  try {
    collectedAmount = ghsInputToPesewas(parsed.data.collectedAmountGhs, "Collected amount");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Enter a valid GHS amount.",
    };
  }

  try {
    await recordSecurityDepositCollection({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
      collectedAmount,
      collectionMethod: parsed.data.collectionMethod,
      referenceNote: parsed.data.referenceNote,
      staffNotes: parsed.data.staffNotes,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Security deposit recorded." };
}

export async function saveInspectionDraftAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const parsed = inspectionDraftSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    inspectionType: formString(formData, "inspectionType"),
    odometer: formString(formData, "odometer") || undefined,
    fuelLevel: formString(formData, "fuelLevel") || undefined,
    generalCondition: formString(formData, "generalCondition") || undefined,
    damageSummary: formString(formData, "damageSummary") || undefined,
    maintenanceRequired: formCheckbox(formData, "maintenanceRequired"),
    staffNotes: formString(formData, "staffNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the inspection." };
  }

  let odometer: number | undefined;
  try {
    odometer = parseOptionalInteger(parsed.data.odometer, "Odometer");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid odometer." };
  }

  try {
    await saveInspectionDraft({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
      inspectionType: parsed.data.inspectionType,
      odometer,
      fuelLevel: parsed.data.fuelLevel,
      generalCondition: parsed.data.generalCondition,
      damageSummary: parsed.data.damageSummary,
      maintenanceRequired: parsed.data.maintenanceRequired,
      staffNotes: parsed.data.staffNotes,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Inspection draft saved." };
}

export async function completeInspectionAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const parsed = inspectionCompleteSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    inspectionType: formString(formData, "inspectionType"),
    odometer: formString(formData, "odometer"),
    fuelLevel: formString(formData, "fuelLevel"),
    generalCondition: formString(formData, "generalCondition"),
    damageSummary: formString(formData, "damageSummary") || undefined,
    maintenanceRequired: formCheckbox(formData, "maintenanceRequired"),
    staffNotes: formString(formData, "staffNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the inspection." };
  }

  const odometer = Number.parseInt(parsed.data.odometer, 10);

  try {
    await completeInspection({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
      inspectionType: parsed.data.inspectionType,
      odometer,
      fuelLevel: parsed.data.fuelLevel,
      generalCondition: parsed.data.generalCondition,
      damageSummary: parsed.data.damageSummary,
      maintenanceRequired: parsed.data.maintenanceRequired,
      staffNotes: parsed.data.staffNotes,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Inspection completed." };
}

export async function uploadInspectionPhotoAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const parsed = inspectionPhotoSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    inspectionType: formString(formData, "inspectionType"),
    category: formString(formData, "category"),
    caption: formString(formData, "caption") || undefined,
    sortOrder: formString(formData, "sortOrder") || "0",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the photo details." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo to upload." };
  }

  const [inspection] = await db
    .select()
    .from(rentalInspections)
    .where(
      and(
        eq(rentalInspections.bookingId, parsed.data.bookingId),
        eq(rentalInspections.inspectionType, parsed.data.inspectionType),
      ),
    )
    .limit(1);

  if (!inspection) {
    return { error: "Save the inspection draft before uploading photos." };
  }
  if (inspection.completedAt) {
    return { error: "This inspection is already completed." };
  }

  try {
    const uploaded = await uploadInspectionPhoto({
      bookingId: parsed.data.bookingId,
      inspectionId: inspection.id,
      file,
    });

    await db.insert(inspectionPhotos).values({
      inspectionId: inspection.id,
      storagePath: uploaded.storagePath,
      category: parsed.data.category,
      caption: parsed.data.caption ?? null,
      sortOrder: parsed.data.sortOrder,
      uploadedBy: staff.id,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "The photo could not be uploaded.",
    };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Photo uploaded." };
}

export async function deleteInspectionPhotoAction(photoId: string): Promise<void> {
  await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const db = tryGetDb();
  if (!db) {
    return;
  }

  const [photo] = await db
    .select({
      id: inspectionPhotos.id,
      storagePath: inspectionPhotos.storagePath,
      bookingId: rentalInspections.bookingId,
    })
    .from(inspectionPhotos)
    .innerJoin(rentalInspections, eq(inspectionPhotos.inspectionId, rentalInspections.id))
    .where(eq(inspectionPhotos.id, photoId))
    .limit(1);

  if (!photo) {
    return;
  }

  await db.delete(inspectionPhotos).where(eq(inspectionPhotos.id, photoId));
  try {
    await deleteInspectionPhotoObject(photo.storagePath);
  } catch {
    // Row removed; file cleanup can be retried later.
  }

  revalidateBookingPaths(photo.bookingId);
}

export async function checkoutVehicleAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const parsed = bookingIdSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  }

  try {
    await checkoutVehicle({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Vehicle handed over to customer." };
}

export async function completeRentalAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(OPERATIONS_MUTATE_ROLES);
  const parsed = bookingIdSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  }

  try {
    await completeRental({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Rental completed." };
}

export async function releaseSecurityDepositAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(SECURITY_DEPOSIT_MUTATE_ROLES);
  const parsed = securityDepositReleaseSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    staffNotes: formString(formData, "staffNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking." };
  }

  try {
    await releaseSecurityDeposit({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
      staffNotes: parsed.data.staffNotes,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Security deposit released." };
}

export async function retainSecurityDepositAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(SECURITY_DEPOSIT_MUTATE_ROLES);
  const parsed = securityDepositRetainSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    reason: formString(formData, "reason"),
    staffNotes: formString(formData, "staffNotes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the retention reason." };
  }

  try {
    await retainSecurityDeposit({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
      reason: parsed.data.reason,
      staffNotes: parsed.data.staffNotes,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateBookingPaths(parsed.data.bookingId);
  return { success: "Security deposit marked as retained." };
}

export async function createMaintenanceRecordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(MAINTENANCE_MUTATE_ROLES);
  const parsed = maintenanceRecordSchema.safeParse({
    vehicleId: formString(formData, "vehicleId"),
    maintenanceType: formString(formData, "maintenanceType"),
    title: formString(formData, "title"),
    description: formString(formData, "description") || undefined,
    startDate: formString(formData, "startDate"),
    startTime: formString(formData, "startTime"),
    endDate: formString(formData, "endDate"),
    endTime: formString(formData, "endTime"),
    odometerAtStart: formString(formData, "odometerAtStart") || undefined,
    costGhs: formString(formData, "costGhs") || undefined,
    providerName: formString(formData, "providerName") || undefined,
    notes: formString(formData, "notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the maintenance record." };
  }

  let startAt: Date;
  let endAt: Date;
  try {
    startAt = accraDateTimeToUtc(parsed.data.startDate, parsed.data.startTime);
    endAt = accraDateTimeToUtc(parsed.data.endDate, parsed.data.endTime);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Enter valid dates and times.",
    };
  }

  let odometerAtStart: number | null = null;
  let cost: number | null = null;
  try {
    odometerAtStart = parseOptionalInteger(parsed.data.odometerAtStart, "Odometer") ?? null;
    if (parsed.data.costGhs) {
      cost = ghsInputToPesewas(parsed.data.costGhs, "Cost");
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Check numeric fields." };
  }

  let record;
  try {
    record = await createMaintenanceRecord({
      vehicleId: parsed.data.vehicleId,
      maintenanceType: parsed.data.maintenanceType,
      title: parsed.data.title,
      description: parsed.data.description,
      startAt,
      endAt,
      odometerAtStart,
      cost,
      providerName: parsed.data.providerName,
      notes: parsed.data.notes,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateMaintenancePaths(record?.id);
  redirect(`/admin/maintenance/${record?.id}`);
}

export async function startMaintenanceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(MAINTENANCE_MUTATE_ROLES);
  const parsed = maintenanceIdSchema.safeParse({
    maintenanceId: formString(formData, "maintenanceId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid maintenance record." };
  }

  try {
    await startMaintenanceRecord({
      maintenanceId: parsed.data.maintenanceId,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateMaintenancePaths(parsed.data.maintenanceId);
  return { success: "Maintenance started." };
}

export async function completeMaintenanceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(MAINTENANCE_MUTATE_ROLES);
  const parsed = maintenanceIdSchema.safeParse({
    maintenanceId: formString(formData, "maintenanceId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid maintenance record." };
  }

  try {
    await completeMaintenanceRecord({
      maintenanceId: parsed.data.maintenanceId,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateMaintenancePaths(parsed.data.maintenanceId);
  return { success: "Maintenance completed." };
}

export async function cancelMaintenanceAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(MAINTENANCE_MUTATE_ROLES);
  const parsed = maintenanceIdSchema.safeParse({
    maintenanceId: formString(formData, "maintenanceId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid maintenance record." };
  }

  try {
    await cancelMaintenanceRecord({
      maintenanceId: parsed.data.maintenanceId,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicOperationsMessage(error) };
  }

  revalidateMaintenancePaths(parsed.data.maintenanceId);
  return { success: "Maintenance cancelled." };
}
