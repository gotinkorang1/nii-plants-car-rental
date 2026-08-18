import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MaintenanceStatusActions } from "@/components/admin/operations/maintenance-status-actions";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import {
  canMutateMaintenance,
  MAINTENANCE_VIEW_ROLES,
} from "@/lib/operations/permissions";
import { getMaintenanceRecord } from "@/lib/operations/queries";
import { formatGhs } from "@/lib/money";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MaintenanceDetailPage({ params }: PageProps) {
  const staff = await requireRole(MAINTENANCE_VIEW_ROLES);
  const { id } = await params;
  const row = await getMaintenanceRecord(id);
  if (!row) {
    notFound();
  }

  const canMutate = canMutateMaintenance(staff.role);
  const { record } = row;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={record.title}
        description={`${row.internalCode} · ${row.make} ${row.model}`}
      />

      <div>
        <Badge variant="outline" className="capitalize">
          {record.status.replaceAll("_", " ")}
        </Badge>
      </div>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
        <h2 className="font-heading text-xl">Details</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Item label="Type" value={record.maintenanceType.replaceAll("_", " ")} />
          <Item
            label="Window"
            value={`${utcToAccraDateInput(record.startAt)} ${utcToAccraTimeInput(record.startAt)} – ${utcToAccraDateInput(record.endAt)} ${utcToAccraTimeInput(record.endAt)}`}
          />
          <Item
            label="Odometer at start"
            value={
              record.odometerAtStart !== null && record.odometerAtStart !== undefined
                ? `${record.odometerAtStart} km`
                : "Not recorded"
            }
          />
          <Item
            label="Cost"
            value={record.cost !== null && record.cost !== undefined ? formatGhs(record.cost) : "Not recorded"}
          />
          <Item label="Provider" value={record.providerName ?? "Not recorded"} />
          <Item label="Description" value={record.description ?? "None"} />
          <Item label="Notes" value={record.notes ?? "None"} />
        </dl>
      </section>

      <MaintenanceStatusActions
        maintenanceId={record.id}
        status={record.status}
        canMutate={canMutate}
      />
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 capitalize">{value}</dd>
    </div>
  );
}
