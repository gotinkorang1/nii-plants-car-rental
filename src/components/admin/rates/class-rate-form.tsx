"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { pesewasToGhsInput } from "@/lib/money";

export function ClassRateForm({
  action,
  item,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  item: {
    id: string;
    name: string;
    active: boolean;
    defaultDailyRate: number;
    defaultSecurityDeposit: number;
    usdDailyRateFrom: number | null;
    usdDailyRateTo: number | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const ghsId = `class-ghs-${item.id}`;
  const depositId = `class-deposit-${item.id}`;
  const usdFromId = `class-usd-from-${item.id}`;
  const usdToId = `class-usd-to-${item.id}`;

  return (
    <article className="rounded-xl bg-card p-4 ring-1 ring-border">
      <form action={formAction} className="space-y-4" aria-busy={pending}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Paystack uses this GHS daily rate for every model in the class.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={item.active ? "secondary" : "outline"}>
              {item.active ? "Active" : "Inactive"}
            </Badge>
            {item.defaultDailyRate === 0 ? (
              <Badge variant="outline">GHS unset</Badge>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link href={`/admin/fleet/classes/${item.id}`}>Class record</Link>
            </Button>
          </div>
        </div>
        {state?.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        {state?.success ? (
          <p className="text-sm text-success">{state.success}</p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-1.5">
            <Label htmlFor={ghsId}>Daily rate (GHS)</Label>
            <Input
              id={ghsId}
              name="defaultDailyRateGhs"
              inputMode="decimal"
              required
              className="tabular-nums"
              defaultValue={pesewasToGhsInput(item.defaultDailyRate)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={depositId}>Deposit (GHS)</Label>
            <Input
              id={depositId}
              name="defaultSecurityDepositGhs"
              inputMode="decimal"
              required
              className="tabular-nums"
              defaultValue={pesewasToGhsInput(item.defaultSecurityDeposit)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={usdFromId}>USD / day from</Label>
            <Input
              id={usdFromId}
              name="usdDailyRateFrom"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="tabular-nums"
              defaultValue={item.usdDailyRateFrom ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={usdToId}>USD / day to</Label>
            <Input
              id={usdToId}
              name="usdDailyRateTo"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              className="tabular-nums"
              defaultValue={item.usdDailyRateTo ?? ""}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving..." : "Save class"}
            </Button>
          </div>
        </div>
      </form>
    </article>
  );
}
