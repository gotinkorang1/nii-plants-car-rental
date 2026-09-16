"use client";

import { useActionState } from "react";

import { QuoteReview } from "@/components/booking/quote-review";
import { DeskPanel } from "@/components/marketing/desk-panel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBookingAction } from "@/lib/booking/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";
import type { BookingPrice } from "@/lib/pricing/types";

export function CustomerDetailsForm({
  quoteId,
  price,
  vehicleLabel,
  className,
  pickupLabel,
  returnLabel,
  pickupLocation,
  returnLocation,
}: {
  quoteId: string;
  price: BookingPrice;
  vehicleLabel: string;
  className: string;
  pickupLabel: string;
  returnLabel: string;
  pickupLocation: string;
  returnLocation: string;
}) {
  const [state, formAction, pending] = useActionState(
    createBookingAction,
    null as ActionState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      aria-busy={pending}
    >
      <input type="hidden" name="quoteId" value={quoteId} />
      {state?.error ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10 lg:col-span-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-6">
        <DeskPanel>
          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="font-heading text-xl">
              Contact details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="firstName" name="firstName" label="First name" autoComplete="given-name" required />
              <Field id="lastName" name="lastName" label="Last name" autoComplete="family-name" required />
              <Field id="email" name="email" type="email" label="Email" autoComplete="email" required />
              <Field id="phone" name="phone" type="tel" label="Phone" autoComplete="tel" required />
            </div>
          </section>
        </DeskPanel>

        <DeskPanel>
          <section aria-labelledby="driver-heading">
            <h2 id="driver-heading" className="font-heading text-xl">
              Driver details
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Drivers must be 25 or older. Licence checks happen at pickup.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                id="driverAge"
                name="driverAge"
                type="number"
                label="Driver age"
                min={25}
                max={99}
                required
              />
              <Field
                id="licenceCountry"
                name="licenceCountry"
                label="Licence country"
                autoComplete="country-name"
                required
              />
              <div className="sm:col-span-2">
                <Field
                  id="licenceNumber"
                  name="licenceNumber"
                  label="Licence number (optional)"
                  autoComplete="off"
                />
              </div>
            </div>
          </section>
        </DeskPanel>

        <DeskPanel>
          <section aria-labelledby="review-heading">
            <h2 id="review-heading" className="font-heading text-xl">
              Booking review
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Vehicle</dt>
                <dd className="text-right">
                  {vehicleLabel}{" "}
                  <span className="text-muted-foreground">or similar</span>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Class</dt>
                <dd>{className}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Pickup</dt>
                <dd className="text-right">
                  {pickupLocation}
                  <br />
                  {pickupLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Return</dt>
                <dd className="text-right">
                  {returnLocation}
                  <br />
                  {returnLabel}
                </dd>
              </div>
            </dl>
            <div className="mt-4">
              <Label htmlFor="customerNotes">Notes for staff (optional)</Label>
              <Textarea id="customerNotes" name="customerNotes" className="mt-1.5 min-h-24" rows={3} />
            </div>
          </section>
        </DeskPanel>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <QuoteReview price={price} />
        <div className="sticky bottom-0 z-20 -mx-4 border-t border-border/80 bg-background/95 px-4 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <Button type="submit" size="lg" className="h-11 w-full transition-all duration-300" disabled={pending}>
            {pending ? (
              <span className="flex items-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating booking…
              </span>
            ) : "Create booking"}
          </Button>
        </div>
      </aside>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  autoComplete,
  min,
  max,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        min={min}
        max={max}
        className="mt-1.5 h-11"
      />
    </div>
  );
}
