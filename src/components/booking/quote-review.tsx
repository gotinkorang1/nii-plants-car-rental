import { SummaryRow } from "@/components/money/summary-row";
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
    <section
      className="rounded-2xl bg-card p-5 ring-1 ring-border"
      aria-labelledby="quote-summary-heading"
      aria-live={live ? "polite" : undefined}
    >
      <h2 id="quote-summary-heading" className="font-heading text-xl">
        Rental summary
      </h2>
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
      <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <SummaryRow label="Rental total" value={formatGhs(price.rentalTotal)} emphasize />
        <SummaryRow label="Reservation payment" value={formatGhs(price.reservationPayment)} />
        <SummaryRow label="Remaining balance" value={formatGhs(price.remainingBalance)} />
      </dl>
      <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm">
        <p className="font-medium">Refundable security deposit</p>
        <p className="mt-1 text-lg font-medium">{formatGhs(price.securityDepositRequired)}</p>
        <p className="mt-1 text-muted-foreground">
          Collected separately. Not included in the rental total.
        </p>
      </div>
    </section>
  );
}
