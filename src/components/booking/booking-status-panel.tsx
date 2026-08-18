import { BookingPaymentButton } from "@/components/booking/booking-payment-button";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import type { PublicBookingView } from "@/lib/bookings/queries";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { paystackConfigured } from "@/lib/payments/paystack/config";
import { SummaryRow } from "@/components/money/summary-row";
import { formatGhs } from "@/lib/money";
import type { PublicContact } from "@/lib/settings/public-contact";
import { mailHref, telHref, whatsappHref } from "@/lib/settings/public-contact";

export function BookingStatusPanel({
  booking,
  contact,
  bookingId,
  showPaymentNotice = true,
}: {
  booking: PublicBookingView;
  contact: PublicContact;
  bookingId: string;
  showPaymentNotice?: boolean;
}) {
  const paymentsEnabled = paystackConfigured();
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="booking-status-heading">
        <h2 id="booking-status-heading" className="font-heading text-xl">
          Booking
        </h2>
        <p className="mt-2 font-medium tracking-wide">{booking.reference}</p>
        <div className="mt-2" aria-live="polite">
          <BookingStatusBadge status={booking.status} label={booking.statusLabel} />
        </div>
      </section>

      <ol className="space-y-2" aria-label="Booking timeline">
        {booking.timeline.map((step) => (
          <li
            key={step.id}
            className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-border"
          >
            <span
              className={
                step.state === "current"
                  ? "size-2.5 rounded-full bg-primary"
                  : step.state === "done"
                    ? "size-2.5 rounded-full bg-foreground/70"
                    : "size-2.5 rounded-full bg-border"
              }
              aria-hidden
            />
            <span>
              {step.label}
              {step.state === "current" ? (
                <span className="sr-only"> (current)</span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="trip-heading">
        <h2 id="trip-heading" className="font-heading text-xl">
          Trip
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <SummaryRow label="Pickup" value={`${booking.pickupLocation} · ${booking.pickupLabel}`} />
          <SummaryRow label="Return" value={`${booking.returnLocation} · ${booking.returnLabel}`} />
          <SummaryRow
            label="Duration"
            value={`${booking.durationDays} ${booking.durationDays === 1 ? "day" : "days"}`}
          />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="vehicle-heading">
        <h2 id="vehicle-heading" className="font-heading text-xl">
          Vehicle
        </h2>
        <p className="mt-3 text-sm">
          {booking.vehicleLabel}{" "}
          <span className="text-muted-foreground">{booking.similarDisclosure}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{booking.className}</p>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="payment-heading">
        <h2 id="payment-heading" className="font-heading text-xl">
          Payment
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <SummaryRow label="Rental total" value={formatGhs(booking.rentalTotal)} emphasize />
          <SummaryRow label="Amount paid" value={formatGhs(booking.amountPaid)} />
          <SummaryRow
            label="Reservation payment required"
            value={formatGhs(booking.reservationPaymentRequired)}
          />
          <SummaryRow label="Remaining balance" value={formatGhs(booking.remainingBalance)} />
          <SummaryRow
            label="Refundable security deposit"
            value={formatGhs(booking.securityDepositRequired)}
          />
          <SummaryRow label="Security deposit status" value={booking.securityDepositSummary} />
        </dl>
        {booking.holdExpiresAt && booking.holdActive ? (
          <p className="mt-3 text-sm text-muted-foreground">
            The vehicle is temporarily held until{" "}
            {utcToAccraDateInput(booking.holdExpiresAt)}{" "}
            {utcToAccraTimeInput(booking.holdExpiresAt)} (Accra time). Availability is
            reserved only within this hold period.
          </p>
        ) : booking.status === "payment_pending" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            The temporary vehicle hold is no longer active. Search availability again
            if you still want this trip.
          </p>
        ) : null}
        {booking.status === "under_review" ? (
          <div
            className="mt-3 rounded-xl border border-[#d9c4a3] bg-[#ede4d4] px-4 py-3 text-sm text-[#5c3d12]"
            role="status"
          >
            <p className="font-medium">Payment received</p>
            <p className="mt-1 text-[#5c3d12]/85">
              Vehicle availability is being reviewed. We will contact you once confirmed.
            </p>
          </div>
        ) : null}
        {booking.remainingBalance === 0 && booking.amountPaid > 0 ? (
          <p className="mt-3 text-sm font-medium">Rental paid in full</p>
        ) : null}
        {showPaymentNotice && booking.status === "payment_pending" && paymentsEnabled ? (
          <div className="mt-4">
            <BookingPaymentButton
              bookingId={bookingId}
              label={booking.initialPaymentLabel}
            />
          </div>
        ) : null}
        {showPaymentNotice &&
        booking.status === "confirmed" &&
        booking.remainingBalance > 0 &&
        paymentsEnabled ? (
          <div className="mt-4">
            <BookingPaymentButton
              bookingId={bookingId}
              label="Pay remaining balance"
              purpose="balance"
            />
          </div>
        ) : null}
        {showPaymentNotice && !paymentsEnabled && booking.status === "payment_pending" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Online payment is not configured in this environment yet.
          </p>
        ) : null}
      </section>

      {booking.paymentHistory.length > 0 ? (
        <section
          className="rounded-2xl bg-card p-5 ring-1 ring-border"
          aria-labelledby="payment-history-heading"
        >
          <h2 id="payment-history-heading" className="font-heading text-xl">
            Payment history
          </h2>
          <ul className="mt-4 space-y-3 text-sm">
            {booking.paymentHistory.map((item) => (
              <li key={item.reference} className="rounded-xl bg-muted/40 px-4 py-3">
                <p className="font-medium">{item.purposeLabel}</p>
                <p className="mt-1 text-muted-foreground">
                  {formatGhs(item.amount)} · {item.statusLabel} · {item.reference}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="support-heading">
        <h2 id="support-heading" className="font-heading text-xl">
          Support
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {contact.phone ? (
            <li>
              <a className="underline-offset-4 hover:underline" href={telHref(contact.phone)}>
                Call {contact.phone}
              </a>
            </li>
          ) : null}
          {contact.whatsapp ? (
            <li>
              <a
                className="underline-offset-4 hover:underline"
                href={whatsappHref(contact.whatsapp)}
              >
                WhatsApp
              </a>
            </li>
          ) : null}
          {contact.email ? (
            <li>
              <a className="underline-offset-4 hover:underline" href={mailHref(contact.email)}>
                Email {contact.email}
              </a>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
