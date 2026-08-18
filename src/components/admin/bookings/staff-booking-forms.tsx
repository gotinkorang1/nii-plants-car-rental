"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelBookingAction,
  updateBookingNotesAction,
} from "@/lib/bookings/admin-actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function StaffCancelForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(
    cancelBookingAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
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
      <div>
        <Label htmlFor="reason">Cancellation reason</Label>
        <Textarea id="reason" name="reason" required className="mt-1.5" rows={3} />
      </div>
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel unpaid booking"}
      </Button>
    </form>
  );
}

export function StaffNotesForm({
  bookingId,
  defaultNotes,
}: {
  bookingId: string;
  defaultNotes: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateBookingNotesAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-3">
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
      <div>
        <Label htmlFor="internalNotes">Internal notes</Label>
        <Textarea
          id="internalNotes"
          name="internalNotes"
          defaultValue={defaultNotes}
          className="mt-1.5"
          rows={5}
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Saving…" : "Save notes"}
      </Button>
    </form>
  );
}
