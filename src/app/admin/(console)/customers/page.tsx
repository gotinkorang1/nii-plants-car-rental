import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
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
import { customerStatusLabel } from "@/lib/bookings/status";
import { CUSTOMER_VIEW_ROLES } from "@/lib/customers/permissions";
import { listAdminCustomers } from "@/lib/customers/queries";
import { formatGhs } from "@/lib/money";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  await requireRole(CUSTOMER_VIEW_ROLES);
  const { q } = await searchParams;
  const rows = await listAdminCustomers(q);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Customers"
        description="People who have hired with Nii Plants. Contact details come from the customers table; hire history comes from bookings."
      />
      <form method="get" className="flex max-w-xl gap-2">
        <Input
          name="q"
          defaultValue={q ?? ""}
          aria-label="Search name, email, phone or booking reference"
          placeholder="Search name, email, phone, booking reference"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No customers match this search.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Hires</TableHead>
                <TableHead>Latest hire</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.firstName} {row.lastName}
                  </TableCell>
                  <TableCell>
                    <div>{row.email}</div>
                    <div className="text-muted-foreground">{row.phone}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.guest ? "outline" : "secondary"}>
                      {row.guest ? "Guest" : "Account linked"}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.bookingCount}</TableCell>
                  <TableCell>
                    {row.lastReference ? (
                      <div>
                        <div>{row.lastReference}</div>
                        <div className="text-muted-foreground">
                          {row.lastPickupAt ? utcToAccraDateInput(row.lastPickupAt) : "—"}
                          {row.lastStatus ? ` · ${customerStatusLabel(row.lastStatus)}` : ""}
                        </div>
                      </div>
                    ) : (
                      "No hires yet"
                    )}
                  </TableCell>
                  <TableCell>{formatGhs(row.outstandingBalance)}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/customers/${row.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
