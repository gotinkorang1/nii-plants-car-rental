import { notFound } from "next/navigation";

import { VehicleClassForm } from "@/components/admin/fleet/vehicle-class-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-staff";
import { getVehicleClass } from "@/lib/fleet/admin-queries";
import {
  deactivateVehicleClass,
  deleteVehicleClass,
  updateVehicleClass,
} from "@/lib/fleet/create-vehicle-class";
import { canManageFleet } from "@/lib/fleet/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVehicleClassPage({ params }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const item = await getVehicleClass(id);

  if (!item) {
    notFound();
  }

  const canWrite = canManageFleet(staff.role);
  const update = updateVehicleClass.bind(null, id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={item.name}
        description={canWrite ? "Update class details or deactivate it." : "Read-only view."}
      />
      {canWrite ? (
        <VehicleClassForm
          action={update}
          defaults={item}
          lockedSlug={item.slugLocked}
          submitLabel="Save class"
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {item.description} This class is {item.active ? "active" : "inactive"}.
        </p>
      )}
      {canWrite ? (
        <div className="flex flex-wrap gap-2">
          <form action={deactivateVehicleClass.bind(null, id)}>
            <Button type="submit" variant="outline">
              Deactivate
            </Button>
          </form>
          <form action={deleteVehicleClass.bind(null, id)}>
            <Button type="submit" variant="destructive">
              Delete if unused
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
