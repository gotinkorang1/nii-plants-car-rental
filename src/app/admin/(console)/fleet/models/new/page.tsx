import { VehicleModelForm } from "@/components/admin/fleet/vehicle-model-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { requireRole } from "@/lib/auth/require-role";
import { listClassOptions } from "@/lib/fleet/admin-queries";
import { createVehicleModel } from "@/lib/fleet/create-vehicle-model";
import { FLEET_MANAGE_ROLES } from "@/lib/fleet/permissions";

export default async function NewVehicleModelPage() {
  await requireRole(FLEET_MANAGE_ROLES);
  const classes = await listClassOptions();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="New vehicle model"
        description="The public slug is generated from make and model. Keep the model unpublished until it is ready."
      />
      <VehicleModelForm
        action={createVehicleModel}
        classes={classes}
        submitLabel="Create model"
      />
    </div>
  );
}
