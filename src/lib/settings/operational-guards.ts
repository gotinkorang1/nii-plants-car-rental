import "server-only";

import { BookingError } from "@/lib/booking/errors";
import { PaymentError } from "@/lib/payments/errors";
import type { SiteSettings } from "@/lib/settings/schema";

export function assertSelfDriveBookingEnabled(settings: SiteSettings): void {
  if (!settings.bookingEnabled) {
    throw new BookingError(
      "BOOKING_DISABLED",
      "Self-drive online booking is temporarily unavailable. Please contact us for assistance.",
    );
  }
}

export function assertOnlinePaymentEnabled(settings: SiteSettings): void {
  if (!settings.onlinePaymentEnabled) {
    throw new PaymentError(
      "PAYSTACK_NOT_CONFIGURED",
      "Online payment is temporarily unavailable. Our team will contact you to complete payment.",
    );
  }
}
