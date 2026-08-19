"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestBookingAccessAction } from "@/lib/booking/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function BookingAccessForm({
  defaultReference,
}: {
  defaultReference?: string;
}) {
  const [state, formAction, pending] = useActionState(
    requestBookingAccessAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div>
        <Label htmlFor="reference">Booking reference</Label>
        <Input
          id="reference"
          name="reference"
          className="mt-1.5 h-11 uppercase"
          autoComplete="off"
          defaultValue={defaultReference}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" className="mt-1.5 h-11" autoComplete="email" required />
      </div>
      <Button type="submit" size="lg" className="h-11 w-full px-4 transition-all duration-300 sm:w-auto" disabled={pending}>
        {pending ? (
          <span className="flex items-center gap-2">
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Checking…
          </span>
        ) : "Access booking"}
      </Button>
    </form>
  );
}
