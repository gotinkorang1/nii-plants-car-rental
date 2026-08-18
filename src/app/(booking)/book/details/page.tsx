import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingPageShell } from "@/components/booking/booking-page-shell";
import { CustomerDetailsForm } from "@/components/booking/customer-details-form";
import { Button } from "@/components/ui/button";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { HOLD_EXPIRED_MESSAGE } from "@/lib/bookings/constants";
import { getQuoteDetails, isBookingPrice } from "@/lib/bookings/queries";

type PageProps = {
  searchParams: Promise<{ quoteId?: string }>;
};

export default async function BookingDetailsPage({ searchParams }: PageProps) {
  const { quoteId } = await searchParams;
  if (!quoteId) {
    notFound();
  }

  const row = await getQuoteDetails(quoteId);
  if (!row || !isBookingPrice(row.quote.pricingSnapshot)) {
    notFound();
  }

  const holdActive = Boolean(row.holdActive) && !row.quoteExpired;

  if (!holdActive) {
    return (
      <BookingPageShell step="details" title="Hold expired">
        <p role="alert" className="text-muted-foreground">
          {HOLD_EXPIRED_MESSAGE}
        </p>
        <Button asChild className="mt-6">
          <Link href="/book">Check availability</Link>
        </Button>
      </BookingPageShell>
    );
  }

  return (
    <BookingPageShell
      step="details"
      eyebrow="Customer details"
      title="Complete your booking"
      lede="The vehicle is temporarily held. Payment is required after you create the booking record."
    >
      <CustomerDetailsForm
          quoteId={row.quote.id}
          price={row.quote.pricingSnapshot}
          vehicleLabel={`${row.model.make} ${row.model.model}`}
          className={row.vehicleClass.name}
          pickupLabel={`${utcToAccraDateInput(row.quote.pickupAt)} ${utcToAccraTimeInput(row.quote.pickupAt)}`}
          returnLabel={`${utcToAccraDateInput(row.quote.returnAt)} ${utcToAccraTimeInput(row.quote.returnAt)}`}
          pickupLocation={row.pickupLocation.name}
          returnLocation={row.returnLocation.name}
      />
    </BookingPageShell>
  );
}
