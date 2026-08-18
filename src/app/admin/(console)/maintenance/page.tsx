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
import {
  canMutateMaintenance,
  MAINTENANCE_VIEW_ROLES,
} from "@/lib/operations/permissions";
import { listMaintenanceRecords } from "@/lib/operations/queries";

type PageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function MaintenanceListPage({ searchParams }: PageProps) {
  const staff = await requireRole(MAINTENANCE_VIEW_ROLES);
  const params = await searchParams;
  const rows = await listMaintenanceRecords({ status: params.status });
  const canWrite = canMutateMaintenance(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Maintenance"
        description="Scheduled and in-progress vehicle maintenance blocks."
        actionHref={canWrite ? "/admin/maintenance/new" : undefined}
        actionLabel={canWrite ? "New record" : undefined}
      />

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <select
          name="status"
          defaultValue={params.status ?? ""}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input px-2.5 text-sm"
        >
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No maintenance records match these filters.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell>
                  {row.internalCode} · {row.make} {row.model}
                </TableCell>
                <TableCell className="capitalize">{row.maintenanceType.replaceAll("_", " ")}</TableCell>
                <TableCell>
                  {utcToAccraDateInput(row.startAt)} {utcToAccraTimeInput(row.startAt)}
                  {" – "}
                  {utcToAccraDateInput(row.endAt)} {utcToAccraTimeInput(row.endAt)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {row.status.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/maintenance/${row.id}`}>Open</Link>
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
