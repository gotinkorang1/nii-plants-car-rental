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
import {
  listClassOptions,
  listPhysicalVehicles,
} from "@/lib/fleet/admin-queries";
import { canManageFleet } from "@/lib/fleet/permissions";

type PageProps = {
  searchParams: Promise<{ q?: string; status?: string; classId?: string }>;
};

export default async function PhysicalVehiclesPage({ searchParams }: PageProps) {
  const staff = await requireStaff();
  const params = await searchParams;
  const [rows, classes] = await Promise.all([
    listPhysicalVehicles({
      search: params.q,
      status: params.status,
      classId: params.classId,
    }),
    listClassOptions(),
  ]);
  const canWrite = canManageFleet(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Physical vehicles"
        description="Internal units only. Registration numbers never appear on public fleet pages."
        actionHref={canWrite ? "/admin/fleet/vehicles/new" : undefined}
        actionLabel={canWrite ? "New vehicle" : undefined}
      />
      <form method="get" className="grid gap-2 sm:grid-cols-4">
        <Input name="q" defaultValue={params.q} placeholder="Search code or registration" aria-label="Search vehicles" />
        <select name="classId" defaultValue={params.classId ?? ""} aria-label="Filter by class" className="h-8 rounded-lg border border-input px-2.5 text-sm">
          <option value="">All classes</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={params.status ?? ""} aria-label="Filter by status" className="h-8 rounded-lg border border-input px-2.5 text-sm">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No physical vehicles match these filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Internal code</TableHead>
              <TableHead>Registration</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Colour</TableHead>
              <TableHead>Mileage</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.internalCode}</TableCell>
                <TableCell>{item.registrationNumber}</TableCell>
                <TableCell>
                  {item.make} {item.modelName}
                </TableCell>
                <TableCell>{item.className}</TableCell>
                <TableCell>{item.colour}</TableCell>
                <TableCell>{item.currentMileage}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{item.branchName}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/fleet/vehicles/${item.id}`}>Open</Link>
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
