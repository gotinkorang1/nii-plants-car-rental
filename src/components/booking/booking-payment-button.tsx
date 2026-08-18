"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initializePaymentAction } from "@/lib/payments/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function BookingPaymentButton({
  bookingId,
  label,
  purpose = "initial",
}: {
  bookingId: string;
  label: string;
  purpose?: "initial" | "balance";
}) {
  const [state, formAction, pending] = useActionState(
    initializePaymentAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="purpose" value={purpose} />
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Opening secure payment..." : label}
      </Button>
    </form>
  );
}
