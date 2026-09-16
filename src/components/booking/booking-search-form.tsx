"use client";

import { useActionState, useState, type ReactNode } from "react";
import { LoaderCircle, LogIn, LogOut as LogOutIcon } from "lucide-react";

import { searchAvailabilityAction } from "@/lib/booking/actions";
import {
  hireDurationMessage,
  previewHireDuration,
} from "@/lib/booking/hire-duration-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  const pickupLocation = (
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
  );
  const returnLocation = (
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
  );
  const pickupDate = (
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
  );
  const pickupTime = (
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
  );
  const returnDate = (
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
  );
  const returnTime = (
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
  );
  const submit = (
    <div
      className={cn(
        compact
          ? "sm:col-span-2 lg:col-span-3 xl:col-span-1"
          : undefined,
      )}
    >
      <Button
        type="submit"
        size="lg"
        className={cn("h-11 w-full bg-accent px-5 text-accent-foreground transition-all duration-300 hover:bg-accent/90", !compact && "sm:w-auto")}
        disabled={pending}
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Checking…
          </span>
        ) : submitLabel}
      </Button>
    </div>
  );

  return (
    <Card
      className={cn(
        "relative gap-0 overflow-hidden rounded-2xl py-0 text-base ring-border transition-shadow duration-300",
        compact
          ? "shadow-[0_20px_50px_rgba(24,26,24,0.16)]"
          : "shadow-[0_12px_32px_rgba(24,26,24,0.08)]",
      )}
    >
      <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" aria-hidden />
      {pending ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/70 px-4 backdrop-blur-[2px] transition-opacity duration-300"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium shadow-sm">
            <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            Checking availability…
          </div>
        </div>
      ) : null}
      <CardContent className="p-4 sm:p-5">
    <form
      action={formAction}
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
          <p className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-accent uppercase">
            <span className="h-px w-5 bg-accent" aria-hidden />
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
        <Alert variant="destructive" className="mb-4 border-destructive/30 bg-destructive/10">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {defaults?.vehicle ? (
        <input type="hidden" name="vehicle" value={defaults.vehicle} />
      ) : null}
      {compact ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 xl:items-end">
          {pickupLocation}
          {returnLocation}
          {pickupDate}
          {pickupTime}
          {returnDate}
          {returnTime}
          {submit}
        </div>
      ) : (
        <div className="space-y-4">
          <fieldset className="grid gap-3 rounded-xl bg-muted/50 p-3 ring-1 ring-border/70 sm:grid-cols-3">
            <legend className="flex items-center gap-1.5 px-1 text-[0.7rem] font-medium tracking-[0.16em] text-accent uppercase">
              <LogIn className="size-3.5" />
              Collect
            </legend>
            {pickupLocation}
            {pickupDate}
            {pickupTime}
          </fieldset>
          <fieldset className="grid gap-3 rounded-xl bg-muted/50 p-3 ring-1 ring-border/70 sm:grid-cols-3">
            <legend className="flex items-center gap-1.5 px-1 text-[0.7rem] font-medium tracking-[0.16em] text-accent uppercase">
              <LogOutIcon className="size-3.5" />
              Return
            </legend>
            {returnLocation}
            {returnDate}
            {returnTime}
          </fieldset>
          {submit}
        </div>
      )}
    </form>
      </CardContent>
    </Card>
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
