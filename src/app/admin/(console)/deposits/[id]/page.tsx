import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DepositSettlementForms } from "@/components/admin/operations/deposit-settlement-forms";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { customerStatusLabel } from "@/lib/bookings/status";
import { formatGhs } from "@/lib/money";
import { getAdminSecurityDeposit } from "@/lib/operations/deposit-queries";
import {
  securityDepositCollectionMethodLabel,
  securityDepositStatusLabel,
} from "@/lib/operations/deposit-status";
import {
  canMutateSecurityDeposit,
  SECURITY_DEPOSIT_VIEW_ROLES,
} from "@/lib/operations/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSecurityDepositDetailPage({ params }: PageProps) {
  const staff = await requireRole(SECURITY_DEPOSIT_VIEW_ROLES);
  const { id } = await params;
  const row = await getAdminSecurityDeposit(id);
  if (!row) {
    notFound();
  }

  const canSettle = canMutateSecurityDeposit(staff.role);
  const { deposit, booking, customer, model } = row;
  const collectedAt = deposit.collectedAt
    ? `${utcToAccraDateInput(deposit.collectedAt)} ${utcToAccraTimeInput(deposit.collectedAt)}`
    : "—";
  const releasedAt = deposit.releasedAt
    ? `${utcToAccraDateInput(deposit.releasedAt)} ${utcToAccraTimeInput(deposit.releasedAt)}`
    : "—";

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={booking.reference}
        description={`${securityDepositStatusLabel(deposit.status)} · ${customer.firstName} ${customer.lastName}`}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/deposits">All deposits</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/bookings/${booking.id}`}>Booking</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/bookings/${booking.id}/pickup`}>Pickup</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/bookings/${booking.id}/return`}>Return</Link>
        </Button>
      </div>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="font-heading text-xl">Deposit record</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Status" value={securityDepositStatusLabel(deposit.status)} />
          <Item label="Required" value={formatGhs(deposit.requiredAmount)} />
          <Item label="Collected" value={formatGhs(deposit.collectedAmount)} />
          <Item
            label="Collection method"
            value={securityDepositCollectionMethodLabel(deposit.collectionMethod)}
          />
          <Item label="Collected at" value={collectedAt} />
          <Item label="Released at" value={releasedAt} />
          <Item label="Reference note" value={deposit.referenceNote ?? "—"} />
          <Item label="Staff notes" value={deposit.staffNotes ?? "—"} />
          <Item label="Retention reason" value={deposit.retentionReason ?? "—"} />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="font-heading text-xl">Booking</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item
            label="Reference"
            value={
              <Link
                href={`/admin/bookings/${booking.id}`}
                className="underline-offset-4 hover:underline"
              >
                {booking.reference}
              </Link>
            }
          />
          <Item label="Customer" value={`${customer.firstName} ${customer.lastName}`} />
          <Item label="Email" value={customer.email} />
          <Item label="Vehicle" value={`${model.make} ${model.model}`} />
          <Item
            label="Pickup"
            value={`${utcToAccraDateInput(booking.pickupAt)} ${utcToAccraTimeInput(booking.pickupAt)}`}
          />
          <Item
            label="Return"
            value={`${utcToAccraDateInput(booking.returnAt)} ${utcToAccraTimeInput(booking.returnAt)}`}
          />
          <Item label="Booking status" value={customerStatusLabel(booking.status)} />
        </dl>
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="font-heading text-xl">Settlement</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Collection is recorded on pickup. Settlement here is a staff status and notes
          change, not an automatic refund.
        </p>
        <div className="mt-4">
          <DepositSettlementForms
            bookingId={booking.id}
            depositStatus={deposit.status}
            disabled={!canSettle}
          />
        </div>
      </section>
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
