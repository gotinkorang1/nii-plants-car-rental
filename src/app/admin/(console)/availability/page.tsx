import { ManualBlockForm } from "@/components/admin/availability/manual-block-form";
import { OccupancyTable } from "@/components/admin/availability/occupancy-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/require-role";
import {
  AVAILABILITY_VIEW_ROLES,
  canManageAvailability,
} from "@/lib/availability/permissions";
import { listStaffOccupancy } from "@/lib/availability/staff-occupancy";
import { accraDateTimeToUtc, utcToAccraDateInput } from "@/lib/booking/timezone";
import {
  listClassOptions,
  listModelOptions,
  listPhysicalVehicles,
} from "@/lib/fleet/admin-queries";

type PageProps = {
  searchParams: Promise<{
    startDate?: string;
    endDate?: string;
    classId?: string;
    modelId?: string;
  }>;
};

export default async function AdminAvailabilityPage({ searchParams }: PageProps) {
  const staff = await requireRole(AVAILABILITY_VIEW_ROLES);
  const params = await searchParams;
  const today = utcToAccraDateInput(new Date());
  const week = new Date();
  week.setUTCDate(week.getUTCDate() + 7);
  const startDate = params.startDate || today;
  const endDate = params.endDate || utcToAccraDateInput(week);
  const startAt = accraDateTimeToUtc(startDate, "00:00");
  const endAt = accraDateTimeToUtc(endDate, "23:59");

  const rows = await listStaffOccupancy({
    startAt,
    endAt,
    classId: params.classId || undefined,
    modelId: params.modelId || undefined,
  });
  const classes = await listClassOptions();
  const models = await listModelOptions();
  const vehicles = await listPhysicalVehicles({});

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Availability"
        description="Physical vehicle occupancy for the selected range. Holds, reservations, maintenance, and manual blocks all appear here."
      />
      <form method="get" className="grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Input type="date" name="startDate" defaultValue={startDate} aria-label="Start date" />
        <Input type="date" name="endDate" defaultValue={endDate} aria-label="End date" />
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
        <select
          name="modelId"
          defaultValue={params.modelId ?? ""}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          aria-label="Vehicle model"
        >
          <option value="">All models</option>
          {models.map((item) => (
            <option key={item.id} value={item.id}>
              {item.make} {item.model}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          View occupancy
        </Button>
      </form>
      {rows.length === 0 ? (
        <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-border">
          No physical vehicles match these filters.
        </p>
      ) : (
        <OccupancyTable rows={rows} canManage={canManageAvailability(staff.role)} />
      )}
      {canManageAvailability(staff.role) ? (
        <ManualBlockForm
          vehicles={vehicles.map((vehicle) => ({
            id: vehicle.id,
            internalCode: vehicle.internalCode,
            make: vehicle.make,
            model: vehicle.modelName,
          }))}
        />
      ) : null}
    </div>
  );
}
