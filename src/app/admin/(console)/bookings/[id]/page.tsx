import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  StaffCancelForm,
  StaffNotesForm,
} from "@/components/admin/bookings/staff-booking-forms";
import { StaffConfirmReviewBookingForm } from "@/components/admin/payments/staff-payment-forms";
import { QuoteReview } from "@/components/booking/quote-review";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { canOperateBookings, BOOKING_VIEW_ROLES } from "@/lib/bookings/permissions";
import { getAdminBooking, isBookingPrice } from "@/lib/bookings/queries";
import { customerStatusLabel } from "@/lib/bookings/status";
import { formatGhs } from "@/lib/money";
import {
  canMutateOperations,
  canViewOperations,
} from "@/lib/operations/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const staff = await requireRole(BOOKING_VIEW_ROLES);
  const { id } = await params;
  const row = await getAdminBooking(id);
  if (!row) {
    notFound();
  }

  const snapshot = isBookingPrice(row.quote.pricingSnapshot)
    ? row.quote.pricingSnapshot
    : null;
  const canOperate = canOperateBookings(staff.role);
  const canViewOps = canViewOperations(staff.role);
  const canMutateOps = canMutateOperations(staff.role);
  const showPickupLink = canViewOps && ["confirmed", "ready"].includes(row.booking.status);
  const showReturnLink = canViewOps && row.booking.status === "checked_out";
  const showRentalRecord =
    canViewOps && ["checked_out", "completed"].includes(row.booking.status);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={row.booking.reference}
        description={`${customerStatusLabel(row.booking.status)} · created ${utcToAccraDateInput(row.booking.createdAt)}`}
      />

      {row.booking.status === "under_review" ? (
        <section className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <h2 className="font-heading text-xl">Payment received — availability review</h2>
          <p className="mt-2 text-sm">
            Verified payment was received but vehicle availability still needs confirmation.
          </p>
          {canOperate ? (
            <div className="mt-4">
              <StaffConfirmReviewBookingForm bookingId={row.booking.id} />
            </div>
          ) : null}
        </section>
      ) : null}

      {showPickupLink || showReturnLink || showRentalRecord ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="operations-heading">
          <h2 id="operations-heading" className="font-heading text-xl">
            Operations
          </h2>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {showPickupLink ? (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={`/admin/bookings/${row.booking.id}/pickup`}>
                  {row.booking.status === "confirmed" ? "Prepare pickup" : "Hand over vehicle"}
                </Link>
              </Button>
            ) : null}
            {showReturnLink ? (
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={`/admin/bookings/${row.booking.id}/return`}>Process return</Link>
              </Button>
            ) : null}
            {showRentalRecord ? (
              <Button asChild variant="ghost" className="w-full sm:w-auto">
                <Link href="/admin/operations/rentals">View rental record</Link>
              </Button>
            ) : null}
          </div>
          {!canMutateOps ? (
            <p className="mt-3 text-sm text-muted-foreground">
              You can view operational workflows but cannot record changes with your role.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="font-heading text-xl">
          Booking summary
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Status" value={customerStatusLabel(row.booking.status)} />
          <Item
            label="Pickup"
            value={`${row.pickupLocation.name} · ${utcToAccraDateInput(row.booking.pickupAt)} ${utcToAccraTimeInput(row.booking.pickupAt)}`}
          />
          <Item
            label="Return"
            value={`${row.returnLocation.name} · ${utcToAccraDateInput(row.booking.returnAt)} ${utcToAccraTimeInput(row.booking.returnAt)}`}
          />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="customer-heading">
        <h2 id="customer-heading" className="font-heading text-xl">
          Customer
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Name" value={`${row.customer.firstName} ${row.customer.lastName}`} />
          <Item label="Email" value={row.customer.email} />
          <Item label="Phone" value={row.customer.phone} />
          <Item label="Driver age" value={String(row.booking.driverAge)} />
          <Item label="Licence country" value={row.booking.licenceCountry} />
          <Item label="Licence number" value={row.booking.licenceNumber ?? "Not provided"} />
          <Item label="Customer notes" value={row.booking.customerNotes ?? "None"} />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="vehicle-heading">
        <h2 id="vehicle-heading" className="font-heading text-xl">
          Vehicle
        </h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Representative model" value={`${row.model.make} ${row.model.model}`} />
          <Item label="Class" value={row.vehicleClass.name} />
          <Item label="Physical vehicle" value={row.vehicle?.internalCode ?? "Unassigned"} />
          <Item
            label="Registration"
            value={row.vehicle?.registrationNumber ?? "Unassigned"}
          />
          <Item label="Allocation status" value={row.allocation?.status ?? "None"} />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading" className="font-heading text-xl">
          Pricing
        </h2>
        {snapshot ? <div className="mt-4"><QuoteReview price={snapshot} /></div> : null}
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Rental total" value={formatGhs(row.booking.rentalTotal)} />
          <Item
            label="Reservation payment"
            value={formatGhs(row.booking.reservationPaymentRequired)}
          />
          <Item label="Remaining balance" value={formatGhs(row.booking.remainingBalance)} />
          <Item
            label="Security deposit requirement"
            value={formatGhs(row.booking.securityDepositRequired)}
          />
          <Item label="Amount paid" value={formatGhs(row.booking.amountPaid)} />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="timeline-heading">
        <h2 id="timeline-heading" className="font-heading text-xl">
          Timeline
        </h2>
        <ol className="mt-4 space-y-3 text-sm">
          {row.history.map((event) => (
            <li key={event.id} className="rounded-xl bg-muted/50 px-4 py-3">
              <p className="font-medium">
                {event.fromStatus ? `${event.fromStatus} → ${event.toStatus}` : event.toStatus}
              </p>
              <p className="mt-1 text-muted-foreground">
                {event.actorType}
                {event.reason ? ` · ${event.reason}` : ""}
                {` · ${utcToAccraDateInput(event.createdAt)} ${utcToAccraTimeInput(event.createdAt)}`}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="notes-heading">
        <h2 id="notes-heading" className="font-heading text-xl">
          Internal notes
        </h2>
        {canOperate ? (
          <div className="mt-4">
            <StaffNotesForm
              bookingId={row.booking.id}
              defaultNotes={row.booking.internalNotes ?? ""}
            />
          </div>
        ) : (
          <p className="mt-3 text-sm whitespace-pre-wrap">
            {row.booking.internalNotes || "None"}
          </p>
        )}
      </section>

      {canOperate &&
      ["draft", "held", "payment_pending", "under_review"].includes(row.booking.status) ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border" aria-labelledby="cancel-heading">
          <h2 id="cancel-heading" className="font-heading text-xl">
            Cancel unpaid booking
          </h2>
          <div className="mt-4">
            <StaffCancelForm bookingId={row.booking.id} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
