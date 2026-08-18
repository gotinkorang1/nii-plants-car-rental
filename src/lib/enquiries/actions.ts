"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRoleAction } from "@/lib/auth/require-role";
import { createStaffEnquiry } from "@/lib/enquiries/create-enquiry";
import { EnquiryError } from "@/lib/enquiries/errors";
import { ENQUIRY_MUTATE_ROLES } from "@/lib/enquiries/permissions";
import {
  assignEnquiry,
  changeEnquiryStatus,
  saveEnquiryQuote,
  updateEnquiryInternalNotes,
} from "@/lib/enquiries/update-enquiry";
import {
  assignEnquirySchema,
  enquiryNotesSchema,
  enquiryQuoteSchema,
  enquiryStatusActionSchema,
  staffEnquirySchema,
} from "@/lib/enquiries/validation";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { formCheckbox, formString } from "@/lib/fleet/action-helpers";

function revalidateEnquiryPaths(enquiryId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/enquiries");
  if (enquiryId) {
    revalidatePath(`/admin/enquiries/${enquiryId}`);
  }
}

function enquiryActionError(error: unknown): ActionState {
  if (error instanceof EnquiryError) {
    return { error: error.message };
  }
  return { error: "This enquiry could not be updated." };
}

export async function createStaffEnquiryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(ENQUIRY_MUTATE_ROLES);
  try {
    const parsed = staffEnquirySchema.safeParse({
      serviceType: formString(formData, "serviceType"),
      firstName: formString(formData, "firstName"),
      lastName: formString(formData, "lastName"),
      email: formString(formData, "email"),
      phone: formString(formData, "phone"),
      companyName: formString(formData, "companyName") || undefined,
      pickupLocationText: formString(formData, "pickupLocationText") || undefined,
      returnLocationText: formString(formData, "returnLocationText") || undefined,
      pickupAt: formString(formData, "pickupAt") || undefined,
      returnAt: formString(formData, "returnAt") || undefined,
      passengerCount: formString(formData, "passengerCount") || undefined,
      vehicleClassId: formString(formData, "vehicleClassId") || undefined,
      customerMessage: formString(formData, "customerMessage") || undefined,
      source: formString(formData, "source"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Check the enquiry details." };
    }

    const result = await createStaffEnquiry({
      staffId: staff.id,
      source: parsed.data.source === "admin" ? "admin" : parsed.data.source,
      payload: parsed.data,
    });

    revalidateEnquiryPaths(result.id);
    redirect(`/admin/enquiries/${result.id}`);
  } catch (error) {
    return enquiryActionError(error);
  }
}

export async function assignEnquiryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(ENQUIRY_MUTATE_ROLES);
  const parsed = assignEnquirySchema.safeParse({
    enquiryId: formString(formData, "enquiryId"),
    assignedTo: formString(formData, "assignedTo") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid assignment." };
  }

  try {
    await assignEnquiry({
      enquiryId: parsed.data.enquiryId,
      assignedTo: parsed.data.assignedTo,
      staffId: staff.id,
    });
    revalidateEnquiryPaths(parsed.data.enquiryId);
    return { success: "Assignment saved." };
  } catch (error) {
    return enquiryActionError(error);
  }
}

export async function changeEnquiryStatusAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(ENQUIRY_MUTATE_ROLES);
  const parsed = enquiryStatusActionSchema.safeParse({
    enquiryId: formString(formData, "enquiryId"),
    toStatus: formString(formData, "toStatus"),
    reason: formString(formData, "reason") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid status change." };
  }

  try {
    await changeEnquiryStatus({
      enquiryId: parsed.data.enquiryId,
      toStatus: parsed.data.toStatus,
      staffId: staff.id,
      reason: parsed.data.reason,
    });
    revalidateEnquiryPaths(parsed.data.enquiryId);
    return { success: "Status updated." };
  } catch (error) {
    return enquiryActionError(error);
  }
}

export async function saveEnquiryQuoteAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(ENQUIRY_MUTATE_ROLES);
  const parsed = enquiryQuoteSchema.safeParse({
    enquiryId: formString(formData, "enquiryId"),
    quotedAmountGhs: formString(formData, "quotedAmountGhs"),
    quoteNotes: formString(formData, "quoteNotes") || undefined,
    quoteValidUntil: formString(formData, "quoteValidUntil") || undefined,
    sendEmail: formCheckbox(formData, "sendEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the quote details." };
  }

  try {
    await saveEnquiryQuote({
      enquiryId: parsed.data.enquiryId,
      quotedAmountGhs: parsed.data.quotedAmountGhs,
      quoteNotes: parsed.data.quoteNotes,
      quoteValidUntil: parsed.data.quoteValidUntil,
      staffId: staff.id,
      sendEmail: parsed.data.sendEmail,
    });
    revalidateEnquiryPaths(parsed.data.enquiryId);
    return { success: "Quote saved." };
  } catch (error) {
    return enquiryActionError(error);
  }
}

export async function updateEnquiryNotesAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(ENQUIRY_MUTATE_ROLES);
  const parsed = enquiryNotesSchema.safeParse({
    enquiryId: formString(formData, "enquiryId"),
    internalNotes: formString(formData, "internalNotes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid notes." };
  }

  try {
    await updateEnquiryInternalNotes({
      enquiryId: parsed.data.enquiryId,
      internalNotes: parsed.data.internalNotes,
      staffId: staff.id,
    });
    revalidateEnquiryPaths(parsed.data.enquiryId);
    return { success: "Notes saved." };
  } catch (error) {
    return enquiryActionError(error);
  }
}
