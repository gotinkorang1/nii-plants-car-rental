"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/fleet/action-helpers";
import type { SiteSettings } from "@/lib/settings/schema";

export function OperationalSettingsForm({
  action,
  defaults,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: Pick<SiteSettings, "bookingEnabled" | "onlinePaymentEnabled">;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-lg border p-4">
      <div>
        <h2 className="font-heading text-lg tracking-tight">Operational controls</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrator only. Marketing pages stay online when booking or payment is disabled.
        </p>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <div className="flex items-start gap-3">
        <input
          id="bookingEnabled"
          name="bookingEnabled"
          type="checkbox"
          defaultChecked={defaults.bookingEnabled}
          className="mt-1 size-4 rounded border"
        />
        <div>
          <Label htmlFor="bookingEnabled">Self-drive booking enabled</Label>
          <p className="text-sm text-muted-foreground">
            When off, customers cannot start new self-drive quotes or bookings.
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <input
          id="onlinePaymentEnabled"
          name="onlinePaymentEnabled"
          type="checkbox"
          defaultChecked={defaults.onlinePaymentEnabled}
          className="mt-1 size-4 rounded border"
        />
        <div>
          <Label htmlFor="onlinePaymentEnabled">Online payment enabled</Label>
          <p className="text-sm text-muted-foreground">
            When off, Paystack checkout is not initialized for new payments.
          </p>
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save operational controls"}
      </Button>
    </form>
  );
}
