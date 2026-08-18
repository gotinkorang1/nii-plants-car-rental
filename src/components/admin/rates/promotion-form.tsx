"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { pesewasToGhsInput } from "@/lib/money";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function PromotionForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    code: string;
    type: "percentage" | "fixed";
    value: number;
    active: boolean;
    startsAt: Date;
    endsAt: Date;
    maxUses: number | null;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="code">Code</Label>
        <Input id="code" name="code" required defaultValue={defaults?.code} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="type">Type</Label>
        <select id="type" name="type" className={selectClassName} defaultValue={defaults?.type ?? "percentage"}>
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="value">Percentage value (0-100)</Label>
        <Input
          id="value"
          name="value"
          type="number"
          min={0}
          max={100}
          defaultValue={defaults?.type === "percentage" ? defaults.value : 10}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="valueGhs">Fixed amount (GHS)</Label>
        <Input
          id="valueGhs"
          name="valueGhs"
          defaultValue={
            defaults?.type === "fixed" ? pesewasToGhsInput(defaults.value) : ""
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="startsAt">Starts at</Label>
        <Input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          required
          defaultValue={defaults ? toLocalInput(defaults.startsAt) : ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="endsAt">Ends at</Label>
        <Input
          id="endsAt"
          name="endsAt"
          type="datetime-local"
          required
          defaultValue={defaults ? toLocalInput(defaults.endsAt) : ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="maxUses">Max uses (optional)</Label>
        <Input id="maxUses" name="maxUses" type="number" min={1} defaultValue={defaults?.maxUses ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? false} />
        Active
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function toLocalInput(value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}T${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`;
}
