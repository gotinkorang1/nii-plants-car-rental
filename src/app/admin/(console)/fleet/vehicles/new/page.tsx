import { PhysicalVehicleForm } from "@/components/admin/fleet/physical-vehicle-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireRole } from "@/lib/auth/require-role";
import {
  listBranchOptions,
  listModelOptions,
} from "@/lib/fleet/admin-queries";
import { createPhysicalVehicle } from "@/lib/fleet/create-vehicle";
import { FLEET_MANAGE_ROLES } from "@/lib/fleet/permissions";

export default async function NewPhysicalVehiclePage() {
  await requireRole(FLEET_MANAGE_ROLES);
  const [models, locations] = await Promise.all([
    listModelOptions(),
    listBranchOptions(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New physical vehicle"
        description="Class is copied from the selected model so the two cannot drift apart."
      />
      <PhysicalVehicleForm
        action={createPhysicalVehicle}
        models={models}
        locations={locations}
        submitLabel="Create vehicle"
      />
    </div>
  );
}
