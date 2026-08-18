"use server";

import { redirect } from "next/navigation";

import { publicBookingMessage } from "@/lib/booking/errors";
import { bookingSearchQuery } from "@/lib/booking/search-params";
import { createBookingFromQuote } from "@/lib/bookings/create-booking";
import {
  clearBookingAccessPending,
  createBookingGuestSession,
  revokeCurrentBookingGuestSession,
  setBookingAccessPending,
} from "@/lib/bookings/guest-session";
import { requestBookingAccessOtp, verifyBookingAccessOtp } from "@/lib/bookings/otp";
import { type ActionState, formString } from "@/lib/fleet/action-helpers";
import { PromotionError, promotionPublicMessage } from "@/lib/pricing/apply-promotion";
import { findPromotionByCode } from "@/lib/pricing/queries";
import { createQuoteAndHold } from "@/lib/quotes/create-quote";
import {
  availabilitySearchSchema,
  quoteRequestSchema,
} from "@/lib/validation/availability";
import {
  bookingAccessRequestSchema,
  bookingOtpSchema,
  customerDetailsSchema,
} from "@/lib/validation/booking";

function extraSelectionsFromForm(formData: FormData) {
  const selected = formData.getAll("extraId").filter((value): value is string => {
    return typeof value === "string" && value.length > 0;
  });

  return selected.map((extraId) => {
    const raw = formString(formData, `quantity-${extraId}`) || "1";
    return {
      extraId,
      quantity: Number(raw),
    };
  });
}

export async function searchAvailabilityAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = availabilitySearchSchema.safeParse({
    pickupLocation: formString(formData, "pickup"),
    returnLocation: formString(formData, "return"),
    pickupDate: formString(formData, "pickupDate"),
    pickupTime: formString(formData, "pickupTime"),
    returnDate: formString(formData, "returnDate"),
    returnTime: formString(formData, "returnTime"),
    vehicle: formString(formData, "vehicle") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the trip details." };
  }

  redirect(`/book/vehicle?${bookingSearchQuery(parsed.data)}`);
}

export async function applyPromoAction(formData: FormData): Promise<{
  ok: boolean;
  message: string;
  promotion?: {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
  };
}> {
  const code = formString(formData, "promoCode");
  if (!code) {
    return { ok: false, message: "Invalid promo code" };
  }

  try {
    const promotion = await findPromotionByCode(code);
    return {
      ok: true,
      message: "Promotion applied",
      promotion: {
        id: promotion.id,
        code: promotion.code,
        type: promotion.type,
        value: promotion.value,
      },
    };
  } catch (error) {
    if (error instanceof PromotionError) {
      return { ok: false, message: promotionPublicMessage(error.reason) };
    }
    return { ok: false, message: "Invalid promo code" };
  }
}

export async function createQuoteAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = quoteRequestSchema.safeParse({
    pickupLocation: formString(formData, "pickup"),
    returnLocation: formString(formData, "return"),
    pickupDate: formString(formData, "pickupDate"),
    pickupTime: formString(formData, "pickupTime"),
    returnDate: formString(formData, "returnDate"),
    returnTime: formString(formData, "returnTime"),
    modelSlug: formString(formData, "modelSlug"),
    promoCode: formString(formData, "promoCode") || undefined,
    extras: extraSelectionsFromForm(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the trip details." };
  }

  let quoteId: string;
  try {
    const created = await createQuoteAndHold({ search: parsed.data });
    quoteId = created.quote.id;
  } catch (error) {
    return { error: publicBookingMessage(error) };
  }

  redirect(`/book/quote/${quoteId}`);
}

export async function createBookingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = customerDetailsSchema.safeParse({
    quoteId: formString(formData, "quoteId"),
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    driverAge: formString(formData, "driverAge"),
    licenceCountry: formString(formData, "licenceCountry"),
    licenceNumber: formString(formData, "licenceNumber") || undefined,
    customerNotes: formString(formData, "customerNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  let booking;
  try {
    booking = await createBookingFromQuote(parsed.data);
  } catch (error) {
    return { error: publicBookingMessage(error) };
  }

  await createBookingGuestSession(booking.id);
  redirect(`/book/complete/${booking.reference}`);
}

export async function requestBookingAccessAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = bookingAccessRequestSchema.safeParse({
    reference: formString(formData, "reference"),
    email: formString(formData, "email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the booking details." };
  }

  const result = await requestBookingAccessOtp(parsed.data);
  if (!result.ok) {
    return { error: result.message };
  }

  await setBookingAccessPending(parsed.data);
  redirect("/booking/verify");
}

export async function verifyBookingAccessAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = bookingOtpSchema.safeParse({
    reference: formString(formData, "reference"),
    email: formString(formData, "email"),
    code: formString(formData, "code").replace(/\D/g, ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter the 6-digit code." };
  }

  let verified;
  try {
    verified = await verifyBookingAccessOtp(parsed.data);
  } catch (error) {
    return { error: publicBookingMessage(error) };
  }

  await createBookingGuestSession(verified.bookingId);
  await clearBookingAccessPending();
  redirect(`/booking/${verified.reference}`);
}

export async function logoutBookingAccessAction() {
  await revokeCurrentBookingGuestSession();
  redirect("/booking");
}

