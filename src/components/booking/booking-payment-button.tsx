"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { initializePaymentAction } from "@/lib/payments/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { formatGhs } from "@/lib/money";

export function BookingPaymentButton({
  bookingId,
  label,
  purpose = "initial",
  amount,
  remainingAfterPayment,
  securityDeposit,
}: {
  bookingId: string;
  label: string;
  purpose?: "initial" | "balance";
  amount: number;
  remainingAfterPayment: number;
  securityDeposit: number;
}) {
  const [state, formAction, pending] = useActionState(
    initializePaymentAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-3" aria-label={`${label} securely with Paystack`}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="purpose" value={purpose} />
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">Payment due now</span>
          <span className="font-semibold">{formatGhs(amount)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4 text-muted-foreground">
          <span>{remainingAfterPayment > 0 ? "Balance after payment" : "Rental balance after payment"}</span>
          <span>{formatGhs(remainingAfterPayment)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Secure checkout by Paystack. The {formatGhs(securityDeposit)} refundable security deposit is handled separately at pickup.
        </p>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} aria-busy={pending} size="lg" className="h-11 w-full px-4 transition-all duration-300 sm:w-auto">
        {pending ? (
          <span className="flex items-center gap-2">
            <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Opening payment…
          </span>
        ) : label}
      </Button>
    </form>
  );
}
