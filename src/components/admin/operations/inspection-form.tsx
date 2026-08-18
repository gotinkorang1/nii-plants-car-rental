"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  completeInspectionAction,
  saveInspectionDraftAction,
} from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

const fuelLevels = [
  { value: "empty", label: "Empty" },
  { value: "quarter", label: "Quarter tank" },
  { value: "half", label: "Half tank" },
  { value: "three_quarters", label: "Three quarters" },
  { value: "full", label: "Full" },
] as const;

const conditions = [
  { value: "good", label: "Good" },
  { value: "attention_required", label: "Attention required" },
  { value: "damage_detected", label: "Damage detected" },
] as const;

type InspectionValues = {
  odometer?: number | null;
  fuelLevel?: string | null;
  generalCondition?: string | null;
  damageSummary?: string | null;
  maintenanceRequired?: boolean;
  staffNotes?: string | null;
  completedAt?: Date | null;
};

export function InspectionForm({
  bookingId,
  inspectionType,
  defaults,
  disabled,
}: {
  bookingId: string;
  inspectionType: "pickup" | "return";
  defaults: InspectionValues;
  disabled?: boolean;
}) {
  const [draftState, draftAction, draftPending] = useActionState(
    saveInspectionDraftAction,
    null as ActionState,
  );
  const [completeState, completeAction, completePending] = useActionState(
    completeInspectionAction,
    null as ActionState,
  );

  const isComplete = Boolean(defaults.completedAt);
  const pending = draftPending || completePending;
  const feedback = completeState ?? draftState;

  return (
    <div className="space-y-4">
      {feedback?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {feedback.error}
        </p>
      ) : null}
      {feedback?.success ? (
        <p role="status" className="text-sm text-success">
          {feedback.success}
        </p>
      ) : null}

      <form action={draftAction} className="space-y-4 rounded-xl bg-muted/30 p-4">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="inspectionType" value={inspectionType} />
        <div className="space-y-1.5">
          <Label htmlFor={`${inspectionType}-odometer`}>Odometer (km)</Label>
          <Input
            id={`${inspectionType}-odometer`}
            name="odometer"
            inputMode="numeric"
            pattern="[0-9]*"
            defaultValue={defaults.odometer ?? ""}
            disabled={disabled || isComplete || pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${inspectionType}-fuel`}>Fuel level</Label>
          <select
            id={`${inspectionType}-fuel`}
            name="fuelLevel"
            defaultValue={defaults.fuelLevel ?? ""}
            disabled={disabled || isComplete || pending}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            <option value="">Select fuel level</option>
            {fuelLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${inspectionType}-condition`}>General condition</Label>
          <select
            id={`${inspectionType}-condition`}
            name="generalCondition"
            defaultValue={defaults.generalCondition ?? ""}
            disabled={disabled || isComplete || pending}
            className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
          >
            <option value="">Select condition</option>
            {conditions.map((condition) => (
              <option key={condition.value} value={condition.value}>
                {condition.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${inspectionType}-damage`}>Damage summary</Label>
          <Textarea
            id={`${inspectionType}-damage`}
            name="damageSummary"
            rows={3}
            defaultValue={defaults.damageSummary ?? ""}
            disabled={disabled || isComplete || pending}
            placeholder="Required when damage is detected"
          />
        </div>
        {inspectionType === "return" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="maintenanceRequired"
              defaultChecked={defaults.maintenanceRequired ?? false}
              disabled={disabled || isComplete || pending}
              className="size-4 rounded border border-input"
            />
            Maintenance required before next rental
          </label>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor={`${inspectionType}-notes`}>Staff notes</Label>
          <Textarea
            id={`${inspectionType}-notes`}
            name="staffNotes"
            rows={3}
            defaultValue={defaults.staffNotes ?? ""}
            disabled={disabled || isComplete || pending}
          />
        </div>
        {!disabled && !isComplete ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" variant="outline" disabled={pending}>
              {draftPending ? "Saving…" : "Save draft"}
            </Button>
            <Button formAction={completeAction} disabled={pending}>
              {completePending ? "Completing…" : "Complete inspection"}
            </Button>
          </div>
        ) : null}
      </form>

      {isComplete ? (
        <p className="text-sm text-muted-foreground">Inspection completed.</p>
      ) : null}
    </div>
  );
}
