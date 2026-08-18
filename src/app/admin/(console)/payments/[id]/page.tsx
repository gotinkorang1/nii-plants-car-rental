import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  StaffConfirmReviewBookingForm,
  StaffRecheckPaymentForm,
} from "@/components/admin/payments/staff-payment-forms";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import {
  canReconcilePayments,
  PAYMENT_VIEW_ROLES,
} from "@/lib/payments/permissions";
import { getAdminPayment } from "@/lib/payments/queries";
import { paymentPurposeLabel } from "@/lib/payments/reconcile-paystack-payment";
import { formatGhs } from "@/lib/money";
import type { ReactNode } from "react";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPaymentDetailPage({ params }: PageProps) {
  const staff = await requireRole(PAYMENT_VIEW_ROLES);
  const { id } = await params;
  const row = await getAdminPayment(id);
  if (!row) {
    notFound();
  }

  const canReconcile = canReconcilePayments(staff.role);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={row.payment.providerReference}
        description={`${paymentPurposeLabel(row.payment.purpose)} · ${row.payment.status}`}
      />

      {row.payment.reviewRequired || row.booking.status === "under_review" ? (
        <section className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <h2 className="font-heading text-xl">Payment received — availability review</h2>
          <p className="mt-2 text-sm">
            Verified money was received but the booking is not fully confirmed yet.
            {row.payment.reviewReason ? ` Reason: ${row.payment.reviewReason}.` : ""}
          </p>
          {row.booking.status === "under_review" ? (
            <div className="mt-4">
              <StaffConfirmReviewBookingForm bookingId={row.booking.id} />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="font-heading text-xl">Payment summary</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Expected amount" value={formatGhs(row.payment.amount)} />
          <Item label="Currency" value={row.payment.currency} />
          <Item label="Purpose" value={paymentPurposeLabel(row.payment.purpose)} />
          <Item label="Status" value={row.payment.status} />
          <Item
            label="Paid at"
            value={
              row.payment.paidAt
                ? `${utcToAccraDateInput(row.payment.paidAt)} ${utcToAccraTimeInput(row.payment.paidAt)}`
                : "—"
            }
          />
          <Item
            label="Provider transaction ID"
            value={row.payment.providerTransactionId ?? "—"}
          />
          <Item label="Review required" value={row.payment.reviewRequired ? "Yes" : "No"} />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="font-heading text-xl">Booking</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item
            label="Reference"
            value={
              <Link href={`/admin/bookings/${row.booking.id}`} className="underline-offset-4 hover:underline">
                {row.booking.reference}
              </Link>
            }
          />
          <Item label="Status" value={row.booking.status} />
          <Item
            label="Customer"
            value={`${row.customer.firstName} ${row.customer.lastName}`}
          />
          <Item label="Email" value={row.customer.email} />
        </dl>
      </section>

      {row.payment.providerSnapshot ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="font-heading text-xl">Verification snapshot</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-muted/40 p-4 text-xs">
            {JSON.stringify(row.payment.providerSnapshot, null, 2)}
          </pre>
        </section>
      ) : null}

      {canReconcile ? (
        <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <h2 className="font-heading text-xl">Recheck payment</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Re-runs Paystack verification. This never manually marks a payment successful.
          </p>
          <div className="mt-4">
            <StaffRecheckPaymentForm paymentId={row.payment.id} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Item({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
