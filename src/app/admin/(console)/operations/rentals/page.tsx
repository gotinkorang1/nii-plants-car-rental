import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { OPERATIONS_VIEW_ROLES } from "@/lib/operations/permissions";
import { listActiveRentals } from "@/lib/operations/queries";

export default async function ActiveRentalsPage() {
  await requireRole(OPERATIONS_VIEW_ROLES);
  const rentals = await listActiveRentals();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Active rentals"
        description="Vehicles currently checked out to customers."
      />

      {rentals.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No active rentals right now.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Return due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell className="font-medium">{rental.reference}</TableCell>
                  <TableCell>
                    {rental.firstName} {rental.lastName}
                  </TableCell>
                  <TableCell>
                    {rental.make} {rental.model}
                    {rental.registration ? ` · ${rental.registration}` : ""}
                  </TableCell>
                  <TableCell>
                    {utcToAccraDateInput(rental.returnAt)} {utcToAccraTimeInput(rental.returnAt)}
                  </TableCell>
                  <TableCell>
                    {rental.overdue ? (
                      <Badge variant="destructive">Overdue</Badge>
                    ) : (
                      <Badge variant="outline">In progress</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/bookings/${rental.id}/return`}>Process return</Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/bookings/${rental.id}`}>Booking</Link>
                    </Button>
                  </TableCell>
                </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
