import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3 } from "lucide-react";

import { BookingPageShell } from "@/components/booking/booking-page-shell";
import { CustomerDetailsForm } from "@/components/booking/customer-details-form";
import { DeskPanel } from "@/components/marketing/desk-panel";
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
        <DeskPanel bodyClassName="p-6 sm:p-8">
          <div className="flex items-start gap-4" role="status">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent" aria-hidden>
              <Clock3 className="size-5" />
            </span>
            <div>
              <h2 className="font-heading text-xl">Your temporary vehicle hold has ended</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {HOLD_EXPIRED_MESSAGE} No payment was taken from this expired hold.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="h-11 px-4" size="lg">
              <Link href="/book">Check availability</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 px-4" size="lg">
              <Link href="/booking">Access an existing booking</Link>
            </Button>
          </div>
        </DeskPanel>
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
