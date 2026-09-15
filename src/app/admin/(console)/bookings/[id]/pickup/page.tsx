import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InspectionForm } from "@/components/admin/operations/inspection-form";
import { BookingVehicleAssignmentForm } from "@/components/admin/operations/booking-vehicle-assignment-form";
import { InspectionPhotoManager } from "@/components/admin/operations/inspection-photo-manager";
import {
  HandoverForm,
  MarkReadyForm,
} from "@/components/admin/operations/operation-action-forms";
import { PickupChecklistForm } from "@/components/admin/operations/pickup-checklist-form";
import { SecurityDepositForm } from "@/components/admin/operations/security-deposit-form";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { customerStatusLabel } from "@/lib/bookings/status";
import {
  canMutateOperations,
  canMutateSecurityDeposit,
  OPERATIONS_VIEW_ROLES,
} from "@/lib/operations/permissions";
import {
  getOperationalBookingContext,
  listAssignableVehicles,
  listInspectionPhotos,
} from "@/lib/operations/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminPickupPage({ params }: PageProps) {
  const staff = await requireRole(OPERATIONS_VIEW_ROLES);
  const { id } = await params;
  const context = await getOperationalBookingContext(id);
  if (!context) {
    notFound();
  }

  const canOperate = canMutateOperations(staff.role);
  const canRecordDeposit = canMutateSecurityDeposit(staff.role);
  const { booking, customer, model, vehicle, pickupInspection, checklist, deposit } = context;
  const photos = pickupInspection
    ? await listInspectionPhotos(pickupInspection.id)
    : [];
  const assignableVehicles = booking.vehicleId
    ? []
    : await listAssignableVehicles(booking.id);

  const pickupAllowed = ["confirmed", "ready"].includes(booking.status);
  const canHandOver = booking.status === "ready" && Boolean(pickupInspection?.completedAt);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Pickup · ${booking.reference}`}
        description={`${customerStatusLabel(booking.status)} · ${customer.firstName} ${customer.lastName}`}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/bookings/${booking.id}`}>Back to booking</Link>
        </Button>
      </div>

      {!pickupAllowed ? (
        <p className="rounded-xl bg-muted/50 p-4 text-sm">
          Pickup preparation is not available for bookings in status{" "}
          {customerStatusLabel(booking.status)}.
        </p>
      ) : (
        <>
          <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-xl">Trip summary</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Vehicle</dt>
                <dd className="mt-1">
                  {model.make} {model.model}
                  {vehicle ? ` · ${vehicle.internalCode} (${vehicle.registrationNumber})` : " · Unassigned"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pickup time</dt>
                <dd className="mt-1">
                  {utcToAccraDateInput(booking.pickupAt)} {utcToAccraTimeInput(booking.pickupAt)}
                </dd>
              </div>
            </dl>
          </section>

          {!booking.vehicleId && canOperate ? (
            <section className="rounded-2xl border border-warning/30 bg-warning/10 p-5">
              <h2 className="font-heading text-xl">Assign physical vehicle</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Select the actual car number that will be handed over at this pickup location.
              </p>
              <div className="mt-4">
                <BookingVehicleAssignmentForm
                  bookingId={booking.id}
                  vehicles={assignableVehicles}
                />
              </div>
            </section>
          ) : null}

          {booking.status === "confirmed" && canOperate ? (
            <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
              <h2 className="font-heading text-xl">Prepare vehicle</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Mark the booking ready once the assigned vehicle has been prepared.
              </p>
              <div className="mt-4">
                <MarkReadyForm bookingId={booking.id} />
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-xl">Pickup checklist</h2>
            <div className="mt-4">
              <PickupChecklistForm
                bookingId={booking.id}
                defaults={{
                  identityChecked: checklist?.identityChecked ?? false,
                  licenceChecked: checklist?.licenceChecked ?? false,
                  vehicleConditionChecked: checklist?.vehicleConditionChecked ?? false,
                  fuelChecked: checklist?.fuelChecked ?? false,
                  odometerChecked: checklist?.odometerChecked ?? false,
                  customerBriefed: checklist?.customerBriefed ?? false,
                  securityDepositRecorded: checklist?.securityDepositRecorded ?? false,
                }}
                disabled={!canOperate}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-xl">Security deposit</h2>
            <div className="mt-4">
              <SecurityDepositForm
                bookingId={booking.id}
                requiredAmount={booking.securityDepositRequired}
                collectedAmount={deposit?.collectedAmount ?? 0}
                collectionMethod={deposit?.collectionMethod}
                referenceNote={deposit?.referenceNote}
                staffNotes={deposit?.staffNotes}
                disabled={!canRecordDeposit}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-xl">Pickup inspection</h2>
            <div className="mt-4">
              <InspectionForm
                bookingId={booking.id}
                inspectionType="pickup"
                defaults={pickupInspection ?? {}}
                disabled={!canOperate}
              />
            </div>
            <div className="mt-6">
              <InspectionPhotoManager
                bookingId={booking.id}
                inspectionType="pickup"
                photos={photos}
                canEdit={canOperate && !pickupInspection?.completedAt}
              />
            </div>
          </section>

          {canHandOver && canOperate ? (
            <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <h2 className="font-heading text-xl">Hand over vehicle</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Complete the checklist, deposit, and pickup inspection before handover.
              </p>
              <div className="mt-4">
                <HandoverForm bookingId={booking.id} />
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
