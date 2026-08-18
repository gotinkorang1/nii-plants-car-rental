"use client";

import { useActionState } from "react";

import { createManualBlockAction } from "@/lib/availability/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ManualBlockForm({
  vehicles,
}: {
  vehicles: { id: string; internalCode: string; make: string; model: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    createManualBlockAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4" aria-busy={pending}>
      <h2 className="font-medium">Block a vehicle</h2>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="vehicleId">Vehicle</Label>
        <select id="vehicleId" name="vehicleId" required className={selectClassName} defaultValue="">
          <option value="">Select vehicle</option>
          {vehicles.map((vehicle) => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.internalCode} · {vehicle.make} {vehicle.model}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input id="startDate" name="startDate" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" required defaultValue="10:00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">End date</Label>
          <Input id="endDate" name="endDate" type="date" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" name="endTime" type="time" required defaultValue="10:00" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="allocationType">Type</Label>
        <select id="allocationType" name="allocationType" className={selectClassName} defaultValue="manual_block">
          <option value="manual_block">Manual block</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Textarea id="reason" name="reason" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Create block"}
      </Button>
    </form>
  );
}
