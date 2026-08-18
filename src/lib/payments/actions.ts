"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { requireRoleAction } from "@/lib/auth/require-role";
import { publicBookingMessage } from "@/lib/booking/errors";
import { type ActionState, formString } from "@/lib/fleet/action-helpers";
import { confirmReviewBookingFromPayment } from "@/lib/payments/confirm-review-booking";
import { createPaymentAttempt } from "@/lib/payments/create-payment";
import { publicPaymentMessage } from "@/lib/payments/errors";
import {
  canReconcilePayments,
  PAYMENT_RECONCILE_ROLES,
} from "@/lib/payments/permissions";
import { reconcilePaystackPayment } from "@/lib/payments/reconcile-paystack-payment";
import {
  createPaymentSchema,
  staffAssignReviewVehicleSchema,
  staffRecheckPaymentSchema,
} from "@/lib/validation/payment";
import { tryGetDb } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function initializePaymentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState & { authorizationUrl?: string }> {
  const parsed = createPaymentSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    purpose: formString(formData, "purpose") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the payment details." };
  }

  let authorizationUrl: string;
  try {
    const created = await createPaymentAttempt({
      bookingId: parsed.data.bookingId,
      purpose: parsed.data.purpose,
    });
    authorizationUrl = created.authorizationUrl;
  } catch (error) {
    return { error: publicPaymentMessage(error) };
  }

  redirect(authorizationUrl);
}

export async function recheckPaymentAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(PAYMENT_RECONCILE_ROLES);
  if (!canReconcilePayments(staff.role)) {
    return { error: "You do not have permission to recheck payments." };
  }

  const parsed = staffRecheckPaymentSchema.safeParse({
    paymentId: formString(formData, "paymentId"),
  });
  if (!parsed.success) {
    return { error: "Choose a valid payment." };
  }

  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const [payment] = await db
    .select({ providerReference: payments.providerReference })
    .from(payments)
    .where(eq(payments.id, parsed.data.paymentId))
    .limit(1);
  if (!payment) {
    return { error: "That payment was not found." };
  }

  await reconcilePaystackPayment(payment.providerReference, "admin");
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${parsed.data.paymentId}`);
  revalidatePath("/admin/bookings");
  return { success: "Payment rechecked with Paystack." };
}

export async function confirmReviewBookingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(["reservations"]);
  const parsed = staffAssignReviewVehicleSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
  });
  if (!parsed.success) {
    return { error: "Choose a valid booking." };
  }

  try {
    await confirmReviewBookingFromPayment({
      bookingId: parsed.data.bookingId,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicBookingMessage(error) };
  }

  revalidatePath(`/admin/bookings/${parsed.data.bookingId}`);
  revalidatePath("/admin/bookings");
  return { success: "Vehicle assigned and booking confirmed." };
}
