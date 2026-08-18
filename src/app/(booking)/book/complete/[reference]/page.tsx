import { redirect } from "next/navigation";

import { BookingLogoutButton } from "@/components/booking/booking-logout-button";
import { BookingPageShell } from "@/components/booking/booking-page-shell";
import { BookingStatusPanel } from "@/components/booking/booking-status-panel";
import { readBookingGuestSession } from "@/lib/bookings/guest-session";
import {
  getPublicBookingByReference,
  getSupportContact,
  loadPublicBooking,
} from "@/lib/bookings/queries";

type PageProps = {
  params: Promise<{ reference: string }>;
};

export default async function BookingCompletePage({ params }: PageProps) {
  const { reference } = await params;
  const session = await readBookingGuestSession();
  const record = await getPublicBookingByReference(reference);
  if (!session || !record || session.bookingId !== record.id) {
    redirect("/booking");
  }

  const [booking, contact] = await Promise.all([
    loadPublicBooking(record.id),
    getSupportContact(),
  ]);
  if (!booking) {
    redirect("/booking");
  }

  return (
    <BookingPageShell
      step="payment"
      eyebrow="Booking created"
      title="Payment required"
      lede="Your booking request has been created. Your vehicle is temporarily held. Payment is required to confirm the reservation."
    >
      <BookingStatusPanel booking={booking} contact={contact} bookingId={record.id} />
      <div className="mt-8">
        <BookingLogoutButton />
      </div>
    </BookingPageShell>
  );
}
