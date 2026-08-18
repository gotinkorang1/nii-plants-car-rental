"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordSecurityDepositAction } from "@/lib/operations/actions";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { pesewasToGhsInput, formatGhs } from "@/lib/money";

const methods = [
  { value: "cash", label: "Cash" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const;

export function SecurityDepositForm({
  bookingId,
  requiredAmount,
  collectedAmount,
  collectionMethod,
  referenceNote,
  staffNotes,
  disabled,
}: {
  bookingId: string;
  requiredAmount: number;
  collectedAmount: number;
  collectionMethod?: string | null;
  referenceNote?: string | null;
  staffNotes?: string | null;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    recordSecurityDepositAction,
    null as ActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="text-sm text-muted-foreground">
        Required deposit: <strong>{formatGhs(requiredAmount)}</strong>
        {collectedAmount > 0 ? (
          <>
            {" "}
            · Recorded: <strong>{formatGhs(collectedAmount)}</strong>
          </>
        ) : null}
      </p>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p role="status" className="text-sm text-success">
          {state.success}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="collectedAmountGhs">Collected amount (GHS)</Label>
        <Input
          id="collectedAmountGhs"
          name="collectedAmountGhs"
          inputMode="decimal"
          defaultValue={
            collectedAmount > 0 ? pesewasToGhsInput(collectedAmount) : requiredAmount > 0 ? pesewasToGhsInput(requiredAmount) : "0.00"
          }
          required
          disabled={disabled || pending}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="collectionMethod">Collection method</Label>
        <select
          id="collectionMethod"
          name="collectionMethod"
          defaultValue={collectionMethod ?? "cash"}
          required
          disabled={disabled || pending}
          className="h-9 w-full rounded-lg border border-input px-2.5 text-sm"
        >
          {methods.map((method) => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="referenceNote">Reference note</Label>
        <Input
          id="referenceNote"
          name="referenceNote"
          defaultValue={referenceNote ?? ""}
          disabled={disabled || pending}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="depositStaffNotes">Staff notes</Label>
        <Textarea
          id="depositStaffNotes"
          name="staffNotes"
          rows={3}
          defaultValue={staffNotes ?? ""}
          disabled={disabled || pending}
        />
      </div>
      {!disabled ? (
        <Button type="submit" variant="outline" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Record deposit"}
        </Button>
      ) : null}
    </form>
  );
}
