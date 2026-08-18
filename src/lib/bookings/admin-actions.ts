"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { writeAuditLog } from "@/lib/audit/write-audit-log";
import { requireRoleAction } from "@/lib/auth/require-role";
import { BookingError, publicBookingMessage } from "@/lib/booking/errors";
import { cancelUnpaidBooking } from "@/lib/bookings/cancel-booking";
import { BOOKING_OPERATE_ROLES } from "@/lib/bookings/permissions";
import { tryGetDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { type ActionState, formString } from "@/lib/fleet/action-helpers";
import { staffCancelBookingSchema, staffNotesSchema } from "@/lib/validation/booking";

export async function cancelBookingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(BOOKING_OPERATE_ROLES);
  const parsed = staffCancelBookingSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    reason: formString(formData, "reason"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a cancellation reason." };
  }

  try {
    await cancelUnpaidBooking({
      bookingId: parsed.data.bookingId,
      reason: parsed.data.reason,
      staffId: staff.id,
    });
  } catch (error) {
    return { error: publicBookingMessage(error) };
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${parsed.data.bookingId}`);
  return { success: "Booking cancelled." };
}

export async function updateBookingNotesAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireRoleAction(BOOKING_OPERATE_ROLES);
  const parsed = staffNotesSchema.safeParse({
    bookingId: formString(formData, "bookingId"),
    internalNotes: formString(formData, "internalNotes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the notes." };
  }

  const db = tryGetDb();
  if (!db) {
    return { error: "The database is not configured." };
  }

  const [existing] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.id, parsed.data.bookingId))
    .limit(1);
  if (!existing) {
    return { error: new BookingError("BOOKING_NOT_FOUND", "That booking was not found.").message };
  }

  await db
    .update(bookings)
    .set({ internalNotes: parsed.data.internalNotes || null })
    .where(eq(bookings.id, parsed.data.bookingId));

  await writeAuditLog({
    actorType: "staff",
    actorId: staff.id,
    action: "booking_notes_updated",
    entityType: "booking",
    entityId: parsed.data.bookingId,
  });

  revalidatePath(`/admin/bookings/${parsed.data.bookingId}`);
  return { success: "Internal notes saved." };
}
