"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  releaseSecurityDepositAction,
  retainSecurityDepositAction,
} from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function DepositSettlementForms({
  bookingId,
  depositStatus,
  disabled,
}: {
  bookingId: string;
  depositStatus?: string | null;
  disabled?: boolean;
}) {
  const [releaseState, releaseAction, releasePending] = useActionState(
    releaseSecurityDepositAction,
    null as ActionState,
  );
  const [retainState, retainAction, retainPending] = useActionState(
    retainSecurityDepositAction,
    null as ActionState,
  );

  if (depositStatus === "not_required") {
    return (
      <p className="text-sm text-muted-foreground">No security deposit required for this booking.</p>
    );
  }

  if (depositStatus === "released" || depositStatus === "retained") {
    return (
      <p className="text-sm text-muted-foreground capitalize">
        Deposit status: {depositStatus.replaceAll("_", " ")}.
      </p>
    );
  }

  if (disabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Viewing only. Reservations, finance, and administrators record collection, release,
        and retain.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <p className="text-sm text-muted-foreground lg:col-span-2">
        Release and retain update this staff record only. They do not send money through
        Paystack.
      </p>
      <form action={releaseAction} className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
        <input type="hidden" name="bookingId" value={bookingId} />
        <h3 className="font-medium">Release deposit</h3>
        {releaseState?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {releaseState.error}
          </p>
        ) : null}
        {releaseState?.success ? (
          <p role="status" className="text-sm text-success">
            {releaseState.success}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="releaseNotes">Staff notes</Label>
          <Textarea id="releaseNotes" name="staffNotes" rows={3} disabled={releasePending} />
        </div>
        <Button type="submit" variant="outline" disabled={releasePending}>
          {releasePending ? "Releasing…" : "Release deposit"}
        </Button>
      </form>

      <form action={retainAction} className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
        <input type="hidden" name="bookingId" value={bookingId} />
        <h3 className="font-medium">Retain deposit</h3>
        {retainState?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {retainState.error}
          </p>
        ) : null}
        {retainState?.success ? (
          <p role="status" className="text-sm text-success">
            {retainState.success}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="retainReason">Retention reason</Label>
          <Input id="retainReason" name="reason" required disabled={retainPending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="retainNotes">Staff notes</Label>
          <Textarea id="retainNotes" name="staffNotes" rows={3} disabled={retainPending} />
        </div>
        <Button type="submit" variant="destructive" disabled={retainPending}>
          {retainPending ? "Saving…" : "Retain deposit"}
        </Button>
      </form>
    </div>
  );
}
