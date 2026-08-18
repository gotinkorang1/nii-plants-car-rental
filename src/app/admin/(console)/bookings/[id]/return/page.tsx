import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DepositSettlementForms } from "@/components/admin/operations/deposit-settlement-forms";
import { InspectionForm } from "@/components/admin/operations/inspection-form";
import { InspectionPhotoManager } from "@/components/admin/operations/inspection-photo-manager";
import { CompleteRentalForm } from "@/components/admin/operations/operation-action-forms";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { utcToAccraDateInput, utcToAccraTimeInput } from "@/lib/booking/timezone";
import { customerStatusLabel } from "@/lib/bookings/status";
import { formatGhs } from "@/lib/money";
import {
  canMutateOperations,
  canMutateSecurityDeposit,
  OPERATIONS_VIEW_ROLES,
} from "@/lib/operations/permissions";
import {
  getOperationalBookingContext,
  listInspectionPhotos,
} from "@/lib/operations/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminReturnPage({ params }: PageProps) {
  const staff = await requireRole(OPERATIONS_VIEW_ROLES);
  const { id } = await params;
  const context = await getOperationalBookingContext(id);
  if (!context) {
    notFound();
  }

  const canOperate = canMutateOperations(staff.role);
  const canSettleDeposit = canMutateSecurityDeposit(staff.role);
  const {
    booking,
    customer,
    model,
    vehicle,
    pickupInspection,
    returnInspection,
    deposit,
    distanceKm,
    overdueReturn,
  } = context;
  const photos = returnInspection
    ? await listInspectionPhotos(returnInspection.id)
    : [];

  const returnAllowed = booking.status === "checked_out";
  const canComplete = returnAllowed && Boolean(returnInspection?.completedAt);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={`Return · ${booking.reference}`}
        description={`${customerStatusLabel(booking.status)} · ${customer.firstName} ${customer.lastName}`}
      />

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/admin/bookings/${booking.id}`}>Back to booking</Link>
        </Button>
        {booking.status === "checked_out" ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/operations/rentals">Active rentals</Link>
          </Button>
        ) : null}
      </div>

      {!returnAllowed ? (
        <p className="rounded-xl bg-muted/50 p-4 text-sm">
          Return processing is available once the vehicle has been checked out.
        </p>
      ) : (
        <>
          {overdueReturn ? (
            <p className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
              This rental is overdue. Scheduled return was{" "}
              {utcToAccraDateInput(booking.returnAt)} {utcToAccraTimeInput(booking.returnAt)}.
            </p>
          ) : null}

          <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-xl">Rental summary</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Vehicle</dt>
                <dd className="mt-1">
                  {model.make} {model.model}
                  {vehicle ? ` · ${vehicle.internalCode}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Return due</dt>
                <dd className="mt-1">
                  {utcToAccraDateInput(booking.returnAt)} {utcToAccraTimeInput(booking.returnAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Pickup odometer</dt>
                <dd className="mt-1">
                  {pickupInspection?.odometer !== null && pickupInspection?.odometer !== undefined
                    ? `${pickupInspection.odometer} km`
                    : "Not recorded"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Distance travelled</dt>
                <dd className="mt-1">
                  {distanceKm !== null ? `${distanceKm} km` : "Complete return inspection"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Remaining balance</dt>
                <dd className="mt-1">{formatGhs(booking.remainingBalance)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-xl">Return inspection</h2>
            <div className="mt-4">
              <InspectionForm
                bookingId={booking.id}
                inspectionType="return"
                defaults={returnInspection ?? {}}
                disabled={!canOperate}
              />
            </div>
            <div className="mt-6">
              <InspectionPhotoManager
                bookingId={booking.id}
                inspectionType="return"
                photos={photos}
                canEdit={canOperate && !returnInspection?.completedAt}
              />
            </div>
          </section>

          <section className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h2 className="font-heading text-xl">Security deposit settlement</h2>
            <div className="mt-4">
              <DepositSettlementForms
                bookingId={booking.id}
                depositStatus={deposit?.status}
                disabled={!canSettleDeposit}
              />
            </div>
          </section>

          {canComplete && canOperate ? (
            <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
              <h2 className="font-heading text-xl">Complete rental</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Finish the rental after the return inspection and deposit settlement are recorded.
              </p>
              <div className="mt-4">
                <CompleteRentalForm bookingId={booking.id} />
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
