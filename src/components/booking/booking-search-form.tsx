"use client";

import { useActionState, useState, type ReactNode } from "react";

import { searchAvailabilityAction } from "@/lib/booking/actions";
import {
  hireDurationMessage,
  previewHireDuration,
} from "@/lib/booking/hire-duration-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PublicSearchLocation } from "@/lib/content/location-type";
import { locationOptionLabel } from "@/lib/content/location-type";
import type { ActionState } from "@/lib/fleet/action-helpers";
import type { AvailabilitySearchInput } from "@/lib/validation/availability";
import { cn } from "@/lib/utils";

const fieldControlClassName =
  "h-11 w-full rounded-lg border border-input bg-background/80 px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function BookingSearchForm({
  locations,
  defaults,
  error,
  submitLabel = "Check availability",
  compact = false,
}: {
  locations: PublicSearchLocation[];
  defaults?: Partial<AvailabilitySearchInput>;
  error?: string;
  submitLabel?: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    searchAvailabilityAction,
    null as ActionState,
  );
  const [hirePreview, setHirePreview] = useState(() =>
    previewHireDuration({
      pickupDate: defaults?.pickupDate,
      pickupTime: defaults?.pickupTime || "10:00",
      returnDate: defaults?.returnDate,
      returnTime: defaults?.returnTime || "10:00",
    }),
  );
  const message = state?.error ?? error;
  const durationCopy = hireDurationMessage(hirePreview);

  return (
    <form
      action={formAction}
      className={cn(
        "rounded-2xl bg-card p-4 ring-1 ring-border sm:p-5",
        compact
          ? "shadow-[0_20px_50px_rgba(24,26,24,0.16)]"
          : "shadow-[0_12px_32px_rgba(24,26,24,0.08)]",
      )}
      aria-labelledby="trip-search-heading"
      aria-busy={pending}
      onInput={(event) => {
        const form = event.currentTarget;
        const data = new FormData(form);
        setHirePreview(
          previewHireDuration({
            pickupDate: String(data.get("pickupDate") ?? ""),
            pickupTime: String(data.get("pickupTime") ?? ""),
            returnDate: String(data.get("returnDate") ?? ""),
            returnTime: String(data.get("returnTime") ?? ""),
          }),
        );
      }}
    >
      <div
        className={cn(
          "mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
        )}
      >
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
            Standard self-drive
          </p>
          <h2 id="trip-search-heading" className="font-heading text-xl">
            Check availability
          </h2>
        </div>
        <p
          aria-live="polite"
          className={cn(
            "text-xs",
            hirePreview.status === "ready" && "font-medium text-primary",
            (hirePreview.status === "order" || hirePreview.status === "invalid") &&
              "text-destructive",
            hirePreview.status === "incomplete" && "text-muted-foreground",
          )}
        >
          {durationCopy}
        </p>
      </div>
      {message ? (
        <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <div
        className={cn(
          "grid gap-3",
          compact
            ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 xl:items-end"
            : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        <Field label="Pickup location" htmlFor="pickup">
          <select
            id="pickup"
            name="pickup"
            required
            className={fieldControlClassName}
            defaultValue={defaults?.pickupLocation ?? ""}
          >
            <option value="">Select pickup</option>
            {locations.map((location) => (
              <option key={location.slug} value={location.slug}>
                {locationOptionLabel(location.name, location.type)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Return location" htmlFor="return">
          <select
            id="return"
            name="return"
            className={fieldControlClassName}
            defaultValue={defaults?.returnLocation ?? ""}
          >
            <option value="">Same as pickup</option>
            {locations.map((location) => (
              <option key={location.slug} value={location.slug}>
                {locationOptionLabel(location.name, location.type)}
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
            className={fieldControlClassName}
            defaultValue={defaults?.pickupDate ?? ""}
          />
        </Field>
        <Field label="Pickup time" htmlFor="pickupTime">
          <Input
            id="pickupTime"
            name="pickupTime"
            type="time"
            required
            className={fieldControlClassName}
            defaultValue={defaults?.pickupTime || "10:00"}
          />
        </Field>
        <Field label="Return date" htmlFor="returnDate">
          <Input
            id="returnDate"
            name="returnDate"
            type="date"
            required
            className={fieldControlClassName}
            defaultValue={defaults?.returnDate ?? ""}
          />
        </Field>
        <Field label="Return time" htmlFor="returnTime">
          <Input
            id="returnTime"
            name="returnTime"
            type="time"
            required
            className={fieldControlClassName}
            defaultValue={defaults?.returnTime || "10:00"}
          />
        </Field>
        {defaults?.vehicle ? (
          <input type="hidden" name="vehicle" value={defaults.vehicle} />
        ) : null}
        <div
          className={cn(
            compact
              ? "sm:col-span-2 lg:col-span-3 xl:col-span-1"
              : "sm:col-span-2 lg:col-span-3",
          )}
        >
          <Button
            type="submit"
            size="lg"
            className={cn("w-full", !compact && "sm:w-auto")}
            disabled={pending}
          >
            {pending ? "Checking availability..." : submitLabel}
          </Button>
        </div>
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
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
