import "server-only";

import { getBookingEmailCopy } from "@/lib/bookings/notify";
import { sendEmail } from "@/lib/email/send-email";
import {
  rentalCompletedEmail,
  vehicleCollectedEmail,
  vehicleReadyEmail,
} from "@/lib/email/templates";
import { log } from "@/lib/logger";

export async function notifyVehicleReady(bookingId: string) {
  const context = await getBookingEmailCopy(bookingId);
  if (!context) {
    return;
  }

  const result = await sendEmail({
    to: context.email,
    email: vehicleReadyEmail({
      firstName: context.firstName,
      reference: context.reference,
      vehicleLabel: context.vehicleLabel,
      pickupLabel: context.pickupLabel,
      accessUrl: context.accessUrl,
    }),
  });

  if (!result.ok) {
    log("warn", "vehicle_ready_email_failed", { bookingId });
  }
}

export async function notifyVehicleCollected(bookingId: string) {
  const context = await getBookingEmailCopy(bookingId);
  if (!context) {
    return;
  }

  const result = await sendEmail({
    to: context.email,
    email: vehicleCollectedEmail({
      firstName: context.firstName,
      reference: context.reference,
      vehicleLabel: context.vehicleLabel,
      returnLabel: context.returnLabel,
      accessUrl: context.accessUrl,
    }),
  });

  if (!result.ok) {
    log("warn", "vehicle_collected_email_failed", { bookingId });
  }
}

export async function notifyRentalCompleted(bookingId: string) {
  const context = await getBookingEmailCopy(bookingId);
  if (!context) {
    return;
  }

  const result = await sendEmail({
    to: context.email,
    email: rentalCompletedEmail({
      firstName: context.firstName,
      reference: context.reference,
      vehicleLabel: context.vehicleLabel,
      accessUrl: context.accessUrl,
    }),
  });

  if (!result.ok) {
    log("warn", "rental_completed_email_failed", { bookingId });
  }
}
