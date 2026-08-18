"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyBookingAccessAction } from "@/lib/booking/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function BookingOtpForm({
  reference,
  email,
}: {
  reference: string;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(
    verifyBookingAccessAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="reference" value={reference} />
      <input type="hidden" name="email" value={email} />
      {state?.error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
          {state.error}
        </p>
      ) : null}
      <div>
        <Label htmlFor="code">6-digit verification code</Label>
        <Input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          className="mt-1.5 tracking-[0.4em]"
          required
        />
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
        {pending ? "Verifying…" : "Verify code"}
      </Button>
    </form>
  );
}
