import { VehicleClassForm } from "@/components/admin/fleet/vehicle-class-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireRole } from "@/lib/auth/require-role";
import { createVehicleClass } from "@/lib/fleet/create-vehicle-class";
import { FLEET_MANAGE_ROLES } from "@/lib/fleet/permissions";

export default async function NewVehicleClassPage() {
  await requireRole(FLEET_MANAGE_ROLES);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New vehicle class"
        description="Rates are entered in GHS and stored as integer pesewas."
      />
      <VehicleClassForm action={createVehicleClass} submitLabel="Create class" />
    </div>
  );
}
