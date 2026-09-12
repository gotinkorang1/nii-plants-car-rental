"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAFF_ROLE_LABELS, STAFF_ROLES, type StaffRole } from "@/lib/auth/roles";
import type { ActionState } from "@/lib/fleet/action-helpers";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function StaffProfileForm({
  action,
  resendAction,
  defaults,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  resendAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: {
    displayName: string;
    email: string;
    role: StaffRole;
    active: boolean;
  };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [resendState, resendFormAction, resendPending] = useActionState(
    resendAction,
    null,
  );

  return (
    <div className="max-w-xl space-y-8">
      <form action={formAction} className="space-y-5">
        {state?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            name="displayName"
            required
            autoComplete="name"
            defaultValue={defaults.displayName}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={defaults.email} readOnly disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Role</Label>
          <select
            id="role"
            name="role"
            className={selectClassName}
            defaultValue={defaults.role}
          >
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {STAFF_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="active"
            defaultChecked={defaults.active}
          />
          Active
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save staff"}
        </Button>
      </form>

      <form action={resendFormAction} className="space-y-3">
        {resendState?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {resendState.error}
          </p>
        ) : null}
        {resendState?.success ? (
          <p className="text-sm text-success">{resendState.success}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Send a new password link if the invite expired. This uses the same
          server-side Auth admin API and email path as the original invite.
        </p>
        <Button type="submit" variant="outline" disabled={resendPending || !defaults.active}>
          {resendPending ? "Sending..." : "Send password link"}
        </Button>
      </form>
    </div>
  );
}
