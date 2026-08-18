"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type VehicleValues = {
  vehicleModelId: string;
  internalCode: string;
  registrationNumber: string;
  colour: string;
  currentMileage: number;
  status: "available" | "rented" | "maintenance" | "inactive";
  branchLocationId: string;
  notes: string | null;
};

export function PhysicalVehicleForm({
  action,
  models,
  locations,
  defaults,
  futureAllocationCount = 0,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  models: { id: string; make: string; model: string; vehicleClassId: string; className: string }[];
  locations: { id: string; name: string }[];
  defaults?: VehicleValues;
  futureAllocationCount?: number;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [modelId, setModelId] = useState(defaults?.vehicleModelId ?? "");
  const selected = useMemo(
    () => models.find((item) => item.id === modelId),
    [modelId, models],
  );

  return (
    <form action={formAction} className="max-w-xl space-y-5" aria-busy={pending}>
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
          {state.success}
        </p>
      ) : null}

      {futureAllocationCount > 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
          <p>
            This vehicle has {futureAllocationCount} future occupancy
            {futureAllocationCount === 1 ? " record" : " records"}. Deactivating it
            will hide it from availability. Existing allocations are not deleted.
          </p>
          <label className="mt-2 flex items-center gap-2">
            <input type="checkbox" name="confirmDeactivate" />
            Confirm deactivation while future occupancy exists
          </label>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="vehicleModelId">Vehicle model</Label>
        <select
          id="vehicleModelId"
          name="vehicleModelId"
          required
          className={selectClassName}
          value={modelId}
          onChange={(event) => setModelId(event.target.value)}
        >
          <option value="">Select model</option>
          {models.map((item) => (
            <option key={item.id} value={item.id}>
              {item.make} {item.model}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Class is assigned from the selected model
          {selected ? `: ${selected.className}` : "."}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="internalCode">Internal code</Label>
        <Input id="internalCode" name="internalCode" required defaultValue={defaults?.internalCode} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="registrationNumber">Registration number</Label>
        <Input id="registrationNumber" name="registrationNumber" required defaultValue={defaults?.registrationNumber} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="colour">Colour</Label>
          <Input id="colour" name="colour" required defaultValue={defaults?.colour} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currentMileage">Mileage</Label>
          <Input id="currentMileage" name="currentMileage" type="number" min={0} required defaultValue={defaults?.currentMileage ?? 0} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <select id="status" name="status" className={selectClassName} defaultValue={defaults?.status ?? "inactive"}>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="branchLocationId">Branch</Label>
        <select id="branchLocationId" name="branchLocationId" required className={selectClassName} defaultValue={defaults?.branchLocationId}>
          <option value="">Select branch</option>
          {locations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Internal notes</Label>
        <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
