"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { pesewasToGhsInput } from "@/lib/money";
import { slugify } from "@/lib/fleet/slug";
import { useState } from "react";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ClassValues = {
  name: string;
  slug: string;
  description: string;
  seats: number;
  luggage: number;
  transmission: "automatic" | "manual";
  defaultDailyRate: number;
  defaultSecurityDeposit: number;
  usdDailyRateFrom?: number | null;
  usdDailyRateTo?: number | null;
  active: boolean;
};

export function VehicleClassForm({
  action,
  defaults,
  lockedSlug = false,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: ClassValues;
  lockedSlug?: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [slug, setSlug] = useState(defaults?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults?.slug));

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

      <Field label="Name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name}
          onChange={(event) => {
            if (!slugTouched && !lockedSlug) {
              setSlug(slugify(event.target.value));
            }
          }}
        />
      </Field>
      <Field label="Slug" htmlFor="slug">
        <Input
          id="slug"
          name="slug"
          value={slug}
          readOnly={lockedSlug}
          onChange={(event) => {
            setSlugTouched(true);
            setSlug(event.target.value);
          }}
        />
        {lockedSlug ? (
          <p className="text-xs text-muted-foreground">
            The slug stays fixed after the class is in use.
          </p>
        ) : null}
      </Field>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" required defaultValue={defaults?.description} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seats" htmlFor="seats">
          <Input id="seats" name="seats" type="number" min={1} required defaultValue={defaults?.seats ?? 4} />
        </Field>
        <Field label="Luggage" htmlFor="luggage">
          <Input id="luggage" name="luggage" type="number" min={0} required defaultValue={defaults?.luggage ?? 2} />
        </Field>
      </div>
      <Field label="Transmission" htmlFor="transmission">
        <select
          id="transmission"
          name="transmission"
          className={selectClassName}
          defaultValue={defaults?.transmission ?? "automatic"}
        >
          <option value="automatic">Automatic</option>
          <option value="manual">Manual</option>
        </select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Daily rate (GHS)" htmlFor="defaultDailyRateGhs">
          <Input
            id="defaultDailyRateGhs"
            name="defaultDailyRateGhs"
            inputMode="decimal"
            required
            defaultValue={pesewasToGhsInput(defaults?.defaultDailyRate ?? 0)}
          />
        </Field>
        <Field label="Security deposit (GHS)" htmlFor="defaultSecurityDepositGhs">
          <Input
            id="defaultSecurityDepositGhs"
            name="defaultSecurityDepositGhs"
            inputMode="decimal"
            required
            defaultValue={pesewasToGhsInput(defaults?.defaultSecurityDeposit ?? 0)}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Published USD / day from" htmlFor="usdDailyRateFrom">
          <Input
            id="usdDailyRateFrom"
            name="usdDailyRateFrom"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            defaultValue={defaults?.usdDailyRateFrom ?? ""}
          />
        </Field>
        <Field label="Published USD / day to" htmlFor="usdDailyRateTo">
          <Input
            id="usdDailyRateTo"
            name="usdDailyRateTo"
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            defaultValue={defaults?.usdDailyRateTo ?? ""}
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        Shop catalogue prices are USD. Booking still uses the GHS daily rate
        (Paystack). Leave USD blank if this class has no published dollar band.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={defaults?.active ?? true}
          className="size-4"
        />
        Active
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
