import { notFound } from "next/navigation";

import { PhysicalVehicleForm } from "@/components/admin/fleet/physical-vehicle-form";
import { VehicleOperationalHistory } from "@/components/admin/fleet/vehicle-operational-history";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  getPhysicalVehicle,
  listBranchOptions,
  listModelOptions,
} from "@/lib/fleet/admin-queries";
import { listFutureBlockingAllocations } from "@/lib/availability/manual-block";
import { getVehicleOperationalHistory } from "@/lib/operations/queries";
import {
  deletePhysicalVehicle,
  updatePhysicalVehicle,
} from "@/lib/fleet/create-vehicle";
import { canManageFleet } from "@/lib/fleet/permissions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPhysicalVehiclePage({ params }: PageProps) {
  const staff = await requireStaff();
  const { id } = await params;
  const [item, models, locations, future, history] = await Promise.all([
    getPhysicalVehicle(id),
    listModelOptions(),
    listBranchOptions(),
    listFutureBlockingAllocations(id),
    getVehicleOperationalHistory(id),
  ]);

  if (!item) {
    notFound();
  }

  const canWrite = canManageFleet(staff.role);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={item.internalCode}
        description="Internal fleet record. Not visible on the public website."
      />
      {canWrite ? (
        <PhysicalVehicleForm
          action={updatePhysicalVehicle.bind(null, id)}
          models={models}
          locations={locations}
          defaults={item}
          futureAllocationCount={future.length}
          submitLabel="Save vehicle"
        />
      ) : (
        <dl className="grid max-w-xl gap-2 text-sm">
          <div>Registration: {item.registrationNumber}</div>
          <div>Colour: {item.colour}</div>
          <div>Mileage: {item.currentMileage}</div>
          <div className="capitalize">Status: {item.status}</div>
        </dl>
      )}
      {canWrite ? (
        <form action={deletePhysicalVehicle.bind(null, id)}>
          <Button type="submit" variant="destructive">
            Delete vehicle
          </Button>
        </form>
      ) : null}
      <VehicleOperationalHistory history={history} futureBlocks={future} />
    </div>
  );
}
