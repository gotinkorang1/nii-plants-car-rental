import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingPageShell } from "@/components/booking/booking-page-shell";
import { QuoteReview } from "@/components/booking/quote-review";
import { Button } from "@/components/ui/button";
import { getQuoteById } from "@/lib/quotes/create-quote";
import type { BookingPrice } from "@/lib/pricing/types";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";

type PageProps = {
  params: Promise<{ id: string }>;
};

function isBookingPrice(value: unknown): value is BookingPrice {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.rentalTotal === "number" &&
    typeof record.reservationPayment === "number" &&
    typeof record.securityDepositRequired === "number"
  );
}

export default async function QuotePage({ params }: PageProps) {
  const { id } = await params;
  const row = await getQuoteById(id);
  if (!row || !isBookingPrice(row.quote.pricingSnapshot)) {
    notFound();
  }

  const snapshot = row.quote.pricingSnapshot;
  const quoteExpired = Boolean(row.quoteExpired);
  const holdActive = Boolean(row.holdActive);

  return (
    <BookingPageShell
      step="details"
      eyebrow="Quote"
      title={`${row.model.make} ${row.model.model}`}
      lede={`${utcToAccraDateInput(row.quote.pickupAt)} ${utcToAccraTimeInput(row.quote.pickupAt)} → ${utcToAccraDateInput(row.quote.returnAt)} ${utcToAccraTimeInput(row.quote.returnAt)}`}
    >
      {quoteExpired || !holdActive ? (
        <p role="alert" className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm">
          This quote is no longer holding a vehicle. Search again to check current availability.
        </p>
      ) : (
        <p className="rounded-xl border-l-2 border-accent bg-primary/5 px-4 py-3 text-sm ring-1 ring-primary/15">
          This price is held until {utcToAccraTimeInput(row.quote.expiresAt)} Accra time.
          Continue to enter your details. Payment is required later to confirm the reservation.
        </p>
      )}
      <div className="mt-6">
        <QuoteReview price={snapshot} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {quoteExpired || !holdActive ? null : (
          <Button asChild size="lg" className="h-11 px-4">
            <Link href={`/book/details?quoteId=${row.quote.id}`}>Continue to details</Link>
          </Button>
        )}
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href="/book">Change dates</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link href="/fleet">Back to fleet</Link>
        </Button>
      </div>
    </BookingPageShell>
  );
}
