"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  cancelMaintenanceAction,
  completeMaintenanceAction,
  startMaintenanceAction,
} from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";

export function MaintenanceStatusActions({
  maintenanceId,
  status,
  canMutate,
}: {
  maintenanceId: string;
  status: string;
  canMutate: boolean;
}) {
  const [startState, startAction, startPending] = useActionState(
    startMaintenanceAction,
    null as ActionState,
  );
  const [completeState, completeAction, completePending] = useActionState(
    completeMaintenanceAction,
    null as ActionState,
  );
  const [cancelState, cancelAction, cancelPending] = useActionState(
    cancelMaintenanceAction,
    null as ActionState,
  );

  if (!canMutate) {
    return null;
  }

  const feedback = startState ?? completeState ?? cancelState;

  return (
    <div className="space-y-3">
      {feedback?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {feedback.error}
        </p>
      ) : null}
      {feedback?.success ? (
        <p role="status" className="text-sm text-success">
          {feedback.success}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        {status === "scheduled" ? (
          <form action={startAction}>
            <input type="hidden" name="maintenanceId" value={maintenanceId} />
            <Button type="submit" disabled={startPending}>
              {startPending ? "Starting…" : "Start maintenance"}
            </Button>
          </form>
        ) : null}
        {status === "scheduled" || status === "in_progress" ? (
          <form action={completeAction}>
            <input type="hidden" name="maintenanceId" value={maintenanceId} />
            <Button type="submit" variant="outline" disabled={completePending}>
              {completePending ? "Completing…" : "Mark completed"}
            </Button>
          </form>
        ) : null}
        {status === "scheduled" || status === "in_progress" ? (
          <form action={cancelAction}>
            <input type="hidden" name="maintenanceId" value={maintenanceId} />
            <Button type="submit" variant="destructive" disabled={cancelPending}>
              {cancelPending ? "Cancelling…" : "Cancel maintenance"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
