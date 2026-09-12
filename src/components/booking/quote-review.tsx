import { DeskPanel } from "@/components/marketing/desk-panel";
import { SummaryRow } from "@/components/money/summary-row";
import { Separator } from "@/components/ui/separator";
import { formatGhs } from "@/lib/money";
import type { BookingPrice } from "@/lib/pricing/types";

export function QuoteReview({
  price,
  live = false,
}: {
  price: BookingPrice;
  live?: boolean;
}) {
  return (
    <DeskPanel>
      <section aria-labelledby="quote-summary-heading" aria-live={live ? "polite" : undefined}>
        <h2 id="quote-summary-heading" className="font-heading text-xl">
          Rental summary
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Hire slip for this trip</p>
        <dl className="mt-4 space-y-2 text-sm">
          <SummaryRow
            label="Rental duration"
            value={`${price.chargeableDays} ${price.chargeableDays === 1 ? "day" : "days"}`}
          />
          <SummaryRow label="Daily rate" value={formatGhs(price.dailyRate)} />
          <SummaryRow label="Base rental" value={formatGhs(price.baseRental)} />
          {price.extras.map((extra) => (
            <SummaryRow
              key={extra.id}
              label={`${extra.name}${extra.quantity > 1 ? ` × ${extra.quantity}` : ""}`}
              value={formatGhs(extra.total)}
            />
          ))}
          {price.discountTotal > 0 ? (
            <SummaryRow
              label={price.promotion ? `Discount (${price.promotion.code})` : "Discount"}
              value={`-${formatGhs(price.discountTotal)}`}
            />
          ) : null}
        </dl>
        <Separator className="my-4" />
        <dl className="space-y-2 text-sm">
          <SummaryRow label="Rental total" value={formatGhs(price.rentalTotal)} emphasize />
          <SummaryRow
            label="Reservation payment"
            value={formatGhs(price.reservationPayment)}
            emphasize
          />
          <SummaryRow label="Remaining balance" value={formatGhs(price.remainingBalance)} />
        </dl>
        <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm">
          <p className="font-medium">Refundable security deposit</p>
          <p className="mt-1 font-heading text-2xl tracking-tight">
            {formatGhs(price.securityDepositRequired)}
          </p>
          <p className="mt-1 text-muted-foreground">
            Collected separately. Not included in the rental total.
          </p>
        </div>
      </section>
    </DeskPanel>
  );
}
