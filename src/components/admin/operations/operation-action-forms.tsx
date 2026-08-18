"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  checkoutVehicleAction,
  completeRentalAction,
  markBookingReadyAction,
} from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function MarkReadyForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(
    markBookingReadyAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
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
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Preparing…" : "Mark ready for pickup"}
      </Button>
    </form>
  );
}

export function HandoverForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(
    checkoutVehicleAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
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
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Handing over…" : "Hand over vehicle"}
      </Button>
    </form>
  );
}

export function CompleteRentalForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(
    completeRentalAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
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
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Completing…" : "Complete rental"}
      </Button>
    </form>
  );
}
