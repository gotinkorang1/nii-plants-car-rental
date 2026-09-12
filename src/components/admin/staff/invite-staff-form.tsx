"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STAFF_ROLE_LABELS, STAFF_ROLES } from "@/lib/auth/roles";
import type { ActionState } from "@/lib/fleet/action-helpers";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InviteStaffForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? <p className="text-sm text-success">{state.success}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" required autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          className={selectClassName}
          defaultValue="reservations"
        >
          {STAFF_ROLES.map((role) => (
            <option key={role} value={role}>
              {STAFF_ROLE_LABELS[role]}
            </option>
          ))}
        </select>
      </div>
      <p className="text-sm text-muted-foreground">
        We create the Auth user on the server and email a link to choose a
        password. Passwords are never set or logged here.
      </p>
      <Button type="submit" disabled={pending}>
        {pending ? "Inviting..." : "Invite staff"}
      </Button>
    </form>
  );
}
