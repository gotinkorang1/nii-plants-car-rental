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
import { BOOKING_STATUSES, customerStatusLabel } from "@/lib/bookings/status";
import { BOOKING_VIEW_ROLES } from "@/lib/bookings/permissions";
import { listAdminBookings } from "@/lib/bookings/queries";
import { utcToAccraDateInput } from "@/lib/booking/timezone";
import { listClassOptions } from "@/lib/fleet/admin-queries";
import { formatGhs } from "@/lib/money";
import type { BookingStatus } from "@/lib/bookings/status";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    pickupDate?: string;
    classId?: string;
    q?: string;
  }>;
};

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  await requireRole(BOOKING_VIEW_ROLES);
  const params = await searchParams;
  const status =
    params.status && BOOKING_STATUSES.includes(params.status as BookingStatus)
      ? (params.status as BookingStatus)
      : "";
  const [rows, classes] = await Promise.all([
    listAdminBookings({
      status,
      pickupDate: params.pickupDate,
      classId: params.classId,
      q: params.q,
    }),
    listClassOptions(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Bookings"
        description="Operational booking records. A booking is not confirmed until a verified payment exists."
      />
      <form method="get" className="grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input
          name="q"
          defaultValue={params.q ?? ""}
          aria-label="Search reference, name, email or phone"
          placeholder="Search reference, name, email, phone"
        />
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          aria-label="Status"
        >
          <option value="">All statuses</option>
          {BOOKING_STATUSES.map((item) => (
            <option key={item} value={item}>
              {customerStatusLabel(item)}
            </option>
          ))}
        </select>
        <Input
          type="date"
          name="pickupDate"
          defaultValue={params.pickupDate ?? ""}
          aria-label="Pickup date"
        />
        <select
          name="classId"
          defaultValue={params.classId ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          aria-label="Vehicle class"
        >
          <option value="">All classes</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No bookings match these filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rental total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/admin/bookings/${row.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {row.reference}
                  </Link>
                </TableCell>
                <TableCell>
                  {row.firstName} {row.lastName}
                </TableCell>
                <TableCell>
                  {row.make} {row.model}
                </TableCell>
                <TableCell>{utcToAccraDateInput(row.pickupAt)}</TableCell>
                <TableCell>{utcToAccraDateInput(row.returnAt)}</TableCell>
                <TableCell>{customerStatusLabel(row.status)}</TableCell>
                <TableCell>{formatGhs(row.rentalTotal)}</TableCell>
                <TableCell>{formatGhs(row.amountPaid)}</TableCell>
                <TableCell>{formatGhs(row.remainingBalance)}</TableCell>
                <TableCell>{utcToAccraDateInput(row.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
