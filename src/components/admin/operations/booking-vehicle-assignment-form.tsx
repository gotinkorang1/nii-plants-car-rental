"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { assignBookingVehicleAction } from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

type AssignableVehicle = {
  id: string;
  internalCode: string;
  registrationNumber: string;
  colour: string;
};

export function BookingVehicleAssignmentForm({
  bookingId,
  vehicles,
}: {
  bookingId: string;
  vehicles: AssignableVehicle[];
}) {
  const [state, formAction, pending] = useActionState(
    assignBookingVehicleAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <label className="block text-sm font-medium" htmlFor="vehicleId">
        Physical vehicle
      </label>
      <select
        id="vehicleId"
        name="vehicleId"
        required
        defaultValue=""
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
        disabled={pending || vehicles.length === 0}
      >
        <option value="">
          {vehicles.length === 0 ? "No available vehicles at this location" : "Select vehicle"}
        </option>
        {vehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicle.internalCode} · {vehicle.registrationNumber} · {vehicle.colour}
          </option>
        ))}
      </select>
      {state?.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      {state?.success ? <p role="status" className="text-sm text-success">{state.success}</p> : null}
      <Button type="submit" disabled={pending || vehicles.length === 0}>
        {pending ? "Assigning…" : "Assign vehicle"}
      </Button>
    </form>
  );
}
