"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
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
          className="mt-1.5 h-11 text-center tracking-[0.4em]"
          required
        />
      </div>
      <Button type="submit" size="lg" className="h-11 w-full sm:w-auto px-4" disabled={pending}>
        {pending ? "Verifying…" : "Verify code"}
      </Button>
    </form>
  );
}
