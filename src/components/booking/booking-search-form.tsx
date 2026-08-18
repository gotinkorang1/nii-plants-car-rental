"use client";

import { useActionState, type ReactNode } from "react";

import { searchAvailabilityAction } from "@/lib/booking/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/fleet/action-helpers";
import type { AvailabilitySearchInput } from "@/lib/validation/availability";

const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BookingSearchForm({
  locations,
  defaults,
  error,
  submitLabel = "Check availability",
}: {
  locations: { slug: string; name: string }[];
  defaults?: Partial<AvailabilitySearchInput>;
  error?: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    searchAvailabilityAction,
    null as ActionState,
  );
  const message = state?.error ?? error;

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-card p-4 shadow-[0_12px_32px_rgba(24,26,24,0.08)] ring-1 ring-border sm:p-5"
      aria-labelledby="trip-search-heading"
      aria-busy={pending}
    >
      <div className="mb-4">
        <p className="text-xs font-medium tracking-wide text-primary uppercase">
          Standard self-drive
        </p>
        <h2 id="trip-search-heading" className="font-heading text-xl">
          Check availability
        </h2>
      </div>
      {message ? (
        <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Pickup location" htmlFor="pickup">
          <select
            id="pickup"
            name="pickup"
            required
            className={selectClassName}
            defaultValue={defaults?.pickupLocation ?? ""}
          >
            <option value="">Select pickup</option>
            {locations.map((location) => (
              <option key={location.slug} value={location.slug}>
                {location.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Return location" htmlFor="return">
          <select
            id="return"
            name="return"
            className={selectClassName}
            defaultValue={defaults?.returnLocation ?? ""}
          >
            <option value="">Same as pickup</option>
            {locations.map((location) => (
              <option key={location.slug} value={location.slug}>
                {location.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pickup date" htmlFor="pickupDate">
          <Input
            id="pickupDate"
            name="pickupDate"
            type="date"
            required
            defaultValue={defaults?.pickupDate}
          />
        </Field>
        <Field label="Pickup time" htmlFor="pickupTime">
          <Input
            id="pickupTime"
            name="pickupTime"
            type="time"
            required
            defaultValue={defaults?.pickupTime ?? "10:00"}
          />
        </Field>
        <Field label="Return date" htmlFor="returnDate">
          <Input
            id="returnDate"
            name="returnDate"
            type="date"
            required
            defaultValue={defaults?.returnDate}
          />
        </Field>
        <Field label="Return time" htmlFor="returnTime">
          <Input
            id="returnTime"
            name="returnTime"
            type="time"
            required
            defaultValue={defaults?.returnTime ?? "10:00"}
          />
        </Field>
      </div>
      {defaults?.vehicle ? (
        <input type="hidden" name="vehicle" value={defaults.vehicle} />
      ) : null}
      <div className="mt-4">
        <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Checking availability..." : submitLabel}
        </Button>
      </div>
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
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
