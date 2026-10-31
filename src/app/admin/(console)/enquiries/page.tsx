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
import { ENQUIRY_VIEW_ROLES } from "@/lib/enquiries/permissions";
import {
  formatEnquiryAge,
  isEnquiryServiceType,
  isEnquiryStatus,
  listAdminEnquiries,
  listAssignableStaff,
} from "@/lib/enquiries/queries";
import {
  ENQUIRY_SERVICE_LABELS,
  ENQUIRY_STATUS_LABELS,
  type EnquiryStatus,
} from "@/lib/enquiries/status";

type PageProps = {
  searchParams: Promise<{
    status?: string;
    serviceType?: string;
    assignedTo?: string;
    createdFrom?: string;
    createdTo?: string;
    q?: string;
  }>;
};

export default async function AdminEnquiriesPage({ searchParams }: PageProps) {
  await requireRole(ENQUIRY_VIEW_ROLES);
  const params = await searchParams;
  const status = params.status && isEnquiryStatus(params.status) ? params.status : "";
  const serviceType =
    params.serviceType && isEnquiryServiceType(params.serviceType)
      ? params.serviceType
      : "";

  const rows = await listAdminEnquiries({
    status,
    serviceType,
    assignedTo: params.assignedTo,
    createdFrom: params.createdFrom,
    createdTo: params.createdTo,
    q: params.q,
  });
  const staff = await listAssignableStaff();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Enquiries"
        description="Manual-review service requests. These do not create bookings or vehicle holds."
        actionHref="/admin/enquiries/new"
        actionLabel="New enquiry"
      />

      <form method="get" className="grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Input
          name="q"
          defaultValue={params.q ?? ""}
          aria-label="Search enquiries"
          placeholder="Reference, name, email..."
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Status"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">All statuses</option>
          {(Object.keys(ENQUIRY_STATUS_LABELS) as EnquiryStatus[]).map((item) => (
            <option key={item} value={item}>
              {ENQUIRY_STATUS_LABELS[item]}
            </option>
          ))}
        </select>
        <select
          name="serviceType"
          defaultValue={serviceType}
          aria-label="Service type"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">All services</option>
          {Object.entries(ENQUIRY_SERVICE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="assignedTo"
          defaultValue={params.assignedTo ?? ""}
          aria-label="Assigned staff"
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
        <Input type="date" name="createdFrom" defaultValue={params.createdFrom ?? ""} aria-label="Created from" />
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No enquiries match these filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl ring-1 ring-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.reference}</TableCell>
                  <TableCell>
                    {row.firstName} {row.lastName}
                  </TableCell>
                  <TableCell>{ENQUIRY_SERVICE_LABELS[row.serviceType]}</TableCell>
                  <TableCell>
                    {row.pickupAt ? utcToAccraDateInput(row.pickupAt) : "—"}
                  </TableCell>
                  <TableCell className="capitalize">
                    {ENQUIRY_STATUS_LABELS[row.status]}
                  </TableCell>
                  <TableCell>{row.assigneeName ?? "Unassigned"}</TableCell>
                  <TableCell>{formatEnquiryAge(row.createdAt)}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/enquiries/${row.id}`}>Open</Link>
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
