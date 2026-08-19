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
      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto px-4" disabled={pending}>
        {pending ? "Checking…" : "Access booking"}
      </Button>
    </form>
  );
}
