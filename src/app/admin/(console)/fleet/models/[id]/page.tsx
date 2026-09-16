import { notFound } from "next/navigation";

import { VehicleImageManager } from "@/components/admin/fleet/vehicle-image-manager";
import { VehicleModelForm } from "@/components/admin/fleet/vehicle-model-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  getVehicleModel,
  listClassOptions,
} from "@/lib/fleet/admin-queries";
import {
  deleteVehicleModel,
  unpublishVehicleModel,
  updateVehicleModel,
} from "@/lib/fleet/create-vehicle-model";
import {
  canEditFleetContent,
  canManageFleet,
} from "@/lib/fleet/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVehicleModelPage({ params }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const item = await getVehicleModel(id);
  const classes = await listClassOptions();

  if (!item) {
    notFound();
  }

  const canContent = canEditFleetContent(staff.role);
  const canManage = canManageFleet(staff.role);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`${item.make} ${item.model}`}
        description={item.published ? "Published on /fleet." : "Unpublished. Hidden from the public catalogue."}
      />
      {canContent ? (
        <VehicleModelForm
          action={updateVehicleModel.bind(null, id)}
          classes={classes}
          defaults={item}
          contentOnly={!canManage}
          lockedSlug={item.published}
          submitLabel="Save model"
        />
      ) : (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}
      <VehicleImageManager
        modelId={id}
        images={item.images}
        canEdit={canContent}
      />
      {canManage || canContent ? (
        <div className="flex flex-wrap gap-2">
          {canContent ? (
            <form action={unpublishVehicleModel.bind(null, id)}>
              <Button type="submit" variant="outline">
                Unpublish
              </Button>
            </form>
          ) : null}
          {canManage ? (
            <form action={deleteVehicleModel.bind(null, id)}>
              <Button type="submit" variant="destructive">
                Delete if unused
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
