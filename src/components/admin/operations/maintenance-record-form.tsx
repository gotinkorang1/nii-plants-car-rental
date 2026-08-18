"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMaintenanceRecordAction } from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

const maintenanceTypes = [
  { value: "scheduled_service", label: "Scheduled service" },
  { value: "repair", label: "Repair" },
  { value: "tyre", label: "Tyre" },
  { value: "battery", label: "Battery" },
  { value: "bodywork", label: "Bodywork" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Other" },
] as const;

type VehicleOption = {
  id: string;
  label: string;
};

export function MaintenanceRecordForm({
  vehicles,
  defaultVehicleId,
}: {
  vehicles: VehicleOption[];
  defaultVehicleId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createMaintenanceRecordAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl bg-card p-5 ring-1 ring-border">
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="vehicleId">Vehicle</Label>
        <select
          id="vehicleId"
          name="vehicleId"
          defaultValue={defaultVehicleId ?? ""}
          required
          disabled={pending}
          className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
        >
          <option value="">Select vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="maintenanceType">Type</Label>
        <select
          id="maintenanceType"
          name="maintenanceType"
          required
          disabled={pending}
          className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
        >
          {maintenanceTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required disabled={pending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} disabled={pending} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" required disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" required disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" required disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" name="endTime" type="time" required disabled={pending} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="odometerAtStart">Odometer at start (km)</Label>
          <Input id="odometerAtStart" name="odometerAtStart" inputMode="numeric" disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="costGhs">Cost (GHS)</Label>
          <Input id="costGhs" name="costGhs" inputMode="decimal" disabled={pending} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="providerName">Provider</Label>
        <Input id="providerName" name="providerName" disabled={pending} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} disabled={pending} />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Creating…" : "Create maintenance record"}
      </Button>
    </form>
  );
}
