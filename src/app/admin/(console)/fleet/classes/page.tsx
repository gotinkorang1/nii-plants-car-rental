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
import { requireStaff } from "@/lib/auth/require-staff";
import { listVehicleClasses } from "@/lib/fleet/admin-queries";
import { canManageFleet } from "@/lib/fleet/permissions";
import { formatGhs, formatUsdDailyRate } from "@/lib/money";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function VehicleClassesPage({ searchParams }: PageProps) {
  const staff = await requireStaff();
  const { q } = await searchParams;
  const classes = await listVehicleClasses(q);
  const canWrite = canManageFleet(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Vehicle classes"
        description="Catalogue groups used by public booking later. Deactivate a class instead of deleting it when models exist."
        actionHref={canWrite ? "/admin/fleet/classes/new" : undefined}
        actionLabel={canWrite ? "New class" : undefined}
      />
      <form method="get" className="flex max-w-md gap-2">
        <Input name="q" defaultValue={q} placeholder="Search classes" aria-label="Search classes" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {classes.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No vehicle classes yet. Create a class or run the catalogue seed.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Seats</TableHead>
              <TableHead>Transmission</TableHead>
              <TableHead>Daily rate</TableHead>
              <TableHead>Models</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  <Badge variant={item.active ? "secondary" : "outline"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{item.seats}</TableCell>
                <TableCell className="capitalize">{item.transmission}</TableCell>
                <TableCell>
                  {item.usdDailyRateFrom
                    ? formatUsdDailyRate(
                        item.usdDailyRateFrom,
                        item.usdDailyRateTo,
                      )
                    : item.defaultDailyRate > 0
                      ? formatGhs(item.defaultDailyRate)
                      : "Unset"}
                </TableCell>
                <TableCell>{item.modelCount}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/fleet/classes/${item.id}`}>Open</Link>
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
