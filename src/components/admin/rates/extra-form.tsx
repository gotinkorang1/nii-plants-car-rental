"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { pesewasToGhsInput } from "@/lib/money";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function ExtraForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    name: string;
    description: string;
    price: number;
    pricingType: "once" | "per_day";
    active: boolean;
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
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required defaultValue={defaults?.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" required defaultValue={defaults?.description} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="priceGhs">Price (GHS)</Label>
        <Input
          id="priceGhs"
          name="priceGhs"
          required
          defaultValue={defaults ? pesewasToGhsInput(defaults.price) : ""}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pricingType">Pricing type</Label>
        <select
          id="pricingType"
          name="pricingType"
          className={selectClassName}
          defaultValue={defaults?.pricingType ?? "per_day"}
        >
          <option value="per_day">Per day</option>
          <option value="once">Once</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={defaults?.active ?? true} />
        Active
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
