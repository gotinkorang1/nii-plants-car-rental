import { BookingPaymentButton } from "@/components/booking/booking-payment-button";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { DeskPanel } from "@/components/marketing/desk-panel";
import { CopyValueButton } from "@/components/marketing/copy-value-button";
import type { PublicBookingView } from "@/lib/bookings/queries";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { paystackConfigured } from "@/lib/payments/paystack/config";
import { SummaryRow } from "@/components/money/summary-row";
import { formatGhs } from "@/lib/money";
import type { PublicContact } from "@/lib/settings/public-contact";
import { mailHref, telHref, whatsappHref } from "@/lib/settings/public-contact";
import { Button } from "@/components/ui/button";

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
      <DeskPanel>
        <section aria-labelledby="booking-status-heading">
          <h2 id="booking-status-heading" className="font-heading text-xl">
            Booking
          </h2>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="font-medium tracking-wide">{booking.reference}</p>
            <CopyValueButton value={booking.reference} label="Copy reference" />
          </div>
          <div className="mt-3" aria-live="polite">
            <BookingStatusBadge status={booking.status} label={booking.statusLabel} />
          </div>
        </section>
      </DeskPanel>

      <ol className="space-y-2" aria-label="Booking timeline">
        {booking.timeline.map((step) => (
          <li
            key={step.id}
            className="flex items-center gap-3 overflow-hidden rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-border"
          >
            <span
              className={
                step.state === "current"
                  ? "size-2.5 rounded-full bg-accent"
                  : step.state === "done"
                    ? "size-2.5 rounded-full bg-primary"
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

      <DeskPanel>
        <section aria-labelledby="trip-heading">
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
      </DeskPanel>

      <DeskPanel>
        <section aria-labelledby="vehicle-heading">
          <h2 id="vehicle-heading" className="font-heading text-xl">
            Vehicle
          </h2>
          <p className="mt-3 text-sm">
            {booking.vehicleLabel}{" "}
            <span className="text-muted-foreground">{booking.similarDisclosure}</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{booking.className}</p>
        </section>
      </DeskPanel>

      <DeskPanel>
        <section aria-labelledby="payment-heading">
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
                amount={booking.initialPaymentLabel === "Pay rental" ? booking.rentalTotal : booking.reservationPaymentRequired}
                remainingAfterPayment={Math.max(
                  0,
                  booking.rentalTotal - booking.amountPaid -
                    (booking.initialPaymentLabel === "Pay rental" ? booking.rentalTotal : booking.reservationPaymentRequired),
                )}
                securityDeposit={booking.securityDepositRequired}
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
                amount={booking.remainingBalance}
                remainingAfterPayment={0}
                securityDeposit={booking.securityDepositRequired}
              />
            </div>
          ) : null}
          {showPaymentNotice && !paymentsEnabled && booking.status === "payment_pending" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Online payment is not configured in this environment yet.
            </p>
          ) : null}
        </section>
      </DeskPanel>

      {booking.paymentHistory.length > 0 ? (
        <DeskPanel>
          <section aria-labelledby="payment-history-heading">
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
        </DeskPanel>
      ) : null}

      <DeskPanel>
        <section aria-labelledby="support-heading">
          <h2 id="support-heading" className="font-heading text-xl">
            Support
          </h2>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {contact.phone ? (
              <Button asChild variant="outline" size="lg" className="h-11 px-4">
                <a href={telHref(contact.phone)}>Call {contact.phone}</a>
              </Button>
            ) : null}
            {contact.whatsapp ? (
              <Button asChild variant="outline" size="lg" className="h-11 px-4">
                <a href={whatsappHref(contact.whatsapp)}>WhatsApp</a>
              </Button>
            ) : null}
            {contact.email ? (
              <Button asChild variant="outline" size="lg" className="h-11 px-4">
                <a href={mailHref(contact.email)}>Email {contact.email}</a>
              </Button>
            ) : null}
          </div>
        </section>
      </DeskPanel>
    </div>
  );
}
