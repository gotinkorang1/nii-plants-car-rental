import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MaintenanceRecordForm } from "@/components/admin/operations/maintenance-record-form";
import { requireRole } from "@/lib/auth/require-role";
import { listPhysicalVehicles } from "@/lib/fleet/admin-queries";
import { MAINTENANCE_MUTATE_ROLES } from "@/lib/operations/permissions";

type PageProps = {
  searchParams: Promise<{ vehicleId?: string }>;
};

export default async function NewMaintenancePage({ searchParams }: PageProps) {
  await requireRole(MAINTENANCE_MUTATE_ROLES);
  const params = await searchParams;
  const vehicles = await listPhysicalVehicles({});

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New maintenance record"
        description="Schedule maintenance and block the vehicle on the availability calendar."
      />
      <MaintenanceRecordForm
        defaultVehicleId={params.vehicleId}
        vehicles={vehicles.map((vehicle) => ({
          id: vehicle.id,
          label: `${vehicle.internalCode} · ${vehicle.registrationNumber} · ${vehicle.make} ${vehicle.modelName}`,
        }))}
      />
    </div>
  );
}
