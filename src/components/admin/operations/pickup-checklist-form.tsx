"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { savePickupChecklistAction } from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

type ChecklistValues = {
  identityChecked: boolean;
  licenceChecked: boolean;
  vehicleConditionChecked: boolean;
  fuelChecked: boolean;
  odometerChecked: boolean;
  customerBriefed: boolean;
  securityDepositRecorded: boolean;
};

export function PickupChecklistForm({
  bookingId,
  defaults,
  disabled,
}: {
  bookingId: string;
  defaults: ChecklistValues;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    savePickupChecklistAction,
    null as ActionState,
  );

  const items: Array<{ name: keyof ChecklistValues; label: string }> = [
    { name: "identityChecked", label: "Identity verified" },
    { name: "licenceChecked", label: "Driving licence verified" },
    { name: "vehicleConditionChecked", label: "Vehicle condition reviewed with customer" },
    { name: "fuelChecked", label: "Fuel level confirmed" },
    { name: "odometerChecked", label: "Odometer reading confirmed" },
    { name: "customerBriefed", label: "Customer briefed on terms and vehicle" },
    { name: "securityDepositRecorded", label: "Security deposit recorded" },
  ];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      ) : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.name}>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                name={item.name}
                defaultChecked={defaults[item.name]}
                disabled={disabled || pending}
                className="mt-1 size-4 rounded border border-input"
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
      {!disabled ? (
        <Button type="submit" variant="outline" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Save checklist"}
        </Button>
      ) : null}
    </form>
  );
}
