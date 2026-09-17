import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput } from "@/lib/booking/timezone";
import { PAYMENT_VIEW_ROLES } from "@/lib/payments/permissions";
import { listAdminPayments } from "@/lib/payments/queries";
import { paymentPurposeLabel } from "@/lib/payments/reconcile-paystack-payment";
import type { PaymentPurpose, PaymentStatus } from "@/lib/payments/types";
import { formatGhs } from "@/lib/money";

const PAYMENT_STATUSES: PaymentStatus[] = [
  "created",
  "provider_pending",
  "succeeded",
  "failed",
  "cancelled",
  "expired",
];

const PAYMENT_PURPOSES: PaymentPurpose[] = [
  "reservation",
  "full_rental",
  "balance",
];

type PageProps = {
  searchParams: Promise<{
    status?: string;
    purpose?: string;
    review?: string;
    date?: string;
    q?: string;
  }>;
};

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  await requireRole(PAYMENT_VIEW_ROLES);
  const params = await searchParams;
  const status = PAYMENT_STATUSES.includes(params.status as PaymentStatus)
    ? (params.status as PaymentStatus)
    : "";
  const purpose = PAYMENT_PURPOSES.includes(params.purpose as PaymentPurpose)
    ? (params.purpose as PaymentPurpose)
    : "";

  const rows = await listAdminPayments({
    status,
    purpose,
    reviewRequired: params.review === "1",
    date: params.date,
    q: params.q,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Payments"
        description="Verified Paystack payments only. Staff cannot manually mark provider payments as successful."
        actionHref="/admin/payments/test"
        actionLabel="Run GH₵3 live test"
      />
      <form method="get" className="grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          name="q"
          defaultValue={params.q ?? ""}
          aria-label="Search payment or booking reference"
          placeholder="Search reference, booking, customer"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {PAYMENT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          name="purpose"
          defaultValue={purpose}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          aria-label="Purpose"
        >
          <option value="">All purposes</option>
          {PAYMENT_PURPOSES.map((item) => (
            <option key={item} value={item}>
              {paymentPurposeLabel(item)}
            </option>
          ))}
        </select>
        <Input type="date" name="date" defaultValue={params.date ?? ""} aria-label="Date" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="review" value="1" defaultChecked={params.review === "1"} />
          Requires review
        </label>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No payments match these filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment reference</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Paid at</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/payments/${row.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.providerReference}
                  </Link>
                </TableCell>
                <TableCell>{row.bookingReference}</TableCell>
                <TableCell>
                  {row.firstName} {row.lastName}
                </TableCell>
                <TableCell>{paymentPurposeLabel(row.purpose)}</TableCell>
                <TableCell>{formatGhs(row.amount)}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>{row.reviewRequired ? "Yes" : "No"}</TableCell>
                <TableCell>
                  {row.paidAt ? utcToAccraDateInput(row.paidAt) : "—"}
                </TableCell>
                <TableCell>{utcToAccraDateInput(row.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
