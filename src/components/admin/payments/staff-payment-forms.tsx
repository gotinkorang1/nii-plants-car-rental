"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  confirmReviewBookingAction,
  recheckPaymentAction,
} from "@/lib/payments/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function StaffRecheckPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, formAction, pending] = useActionState(
    recheckPaymentAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="paymentId" value={paymentId} />
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Rechecking…" : "Recheck with Paystack"}
      </Button>
    </form>
  );
}

export function StaffConfirmReviewBookingForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(
    confirmReviewBookingAction,
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
        <p role="status" className="text-sm">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Confirming…" : "Assign available vehicle and confirm"}
      </Button>
    </form>
  );
}
