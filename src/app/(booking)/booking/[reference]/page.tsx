import { redirect } from "next/navigation";

import { BookingLogoutButton } from "@/components/booking/booking-logout-button";
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

export default async function GuestBookingPage({ params }: PageProps) {
  const { reference } = await params;
  const normalized = decodeURIComponent(reference).toUpperCase();
  const session = await readBookingGuestSession();
  if (!session) {
    redirect(`/booking?reference=${encodeURIComponent(normalized)}`);
  }

  const record = await getPublicBookingByReference(normalized);
  if (!record || session.bookingId !== record.id) {
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Your booking
          </p>
          <h1 className="mt-2 font-heading text-4xl tracking-tight">{booking.reference}</h1>
        </div>
        <BookingLogoutButton />
      </div>
      <div className="mt-8">
        <BookingStatusPanel booking={booking} contact={contact} bookingId={record.id} />
      </div>
    </main>
  );
}
