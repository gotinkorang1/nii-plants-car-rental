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
import { formatGhs } from "@/lib/money";
import { listAdminSecurityDeposits } from "@/lib/operations/deposit-queries";
import {
  parseSecurityDepositStatus,
  SECURITY_DEPOSIT_STATUSES,
  securityDepositStatusLabel,
} from "@/lib/operations/deposit-status";
import { SECURITY_DEPOSIT_VIEW_ROLES } from "@/lib/operations/permissions";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

export default async function AdminSecurityDepositsPage({ searchParams }: PageProps) {
  await requireRole(SECURITY_DEPOSIT_VIEW_ROLES);
  const params = await searchParams;
  const status = parseSecurityDepositStatus(params.status);

  const rows = await listAdminSecurityDeposits({
    status,
    q: params.q,
  });

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Security deposits"
        description="Staff-recorded refundable deposits from pickup and return. Release and retain update the record; they do not send a Paystack refund."
      />
      <form method="get" className="grid max-w-3xl gap-3 sm:grid-cols-3">
        <Input
          name="q"
          defaultValue={params.q ?? ""}
          aria-label="Search booking reference, name or email"
          placeholder="Search reference, name, email"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {SECURITY_DEPOSIT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {securityDepositStatusLabel(item)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No security deposits match these filters. Records appear after pickup preparation
          creates a deposit row.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Required</TableHead>
              <TableHead>Collected</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Booking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/deposits/${row.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.bookingReference}
                  </Link>
                </TableCell>
                <TableCell>
                  {row.firstName} {row.lastName}
                </TableCell>
                <TableCell>
                  {row.make} {row.model}
                </TableCell>
                <TableCell>{formatGhs(row.requiredAmount)}</TableCell>
                <TableCell>{formatGhs(row.collectedAmount)}</TableCell>
                <TableCell>{securityDepositStatusLabel(row.status)}</TableCell>
                <TableCell>{utcToAccraDateInput(row.pickupAt)}</TableCell>
                <TableCell>{utcToAccraDateInput(row.returnAt)}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/bookings/${row.bookingId}`}
                    className="underline-offset-4 hover:underline"
                  >
                    Booking
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
