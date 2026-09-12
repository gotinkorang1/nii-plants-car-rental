"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell, TableRow } from "@/components/ui/table";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { formatGhs, formatUsdDailyRate } from "@/lib/money";

export function ModelRateForm({
  action,
  item,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  item: {
    id: string;
    make: string;
    model: string;
    published: boolean;
    usdDailyRateFrom: number | null;
    usdDailyRateTo: number | null;
    className: string;
    classDailyRate: number;
    classUsdDailyRateFrom: number | null;
    classUsdDailyRateTo: number | null;
  };
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const usdFromId = `model-usd-from-${item.id}`;
  const usdToId = `model-usd-to-${item.id}`;
  const inheritsClassUsd = item.usdDailyRateFrom == null;
  const publishedFrom = item.usdDailyRateFrom ?? item.classUsdDailyRateFrom;
  const publishedTo = item.usdDailyRateTo ?? item.classUsdDailyRateTo;

  return (
    <TableRow className="align-top">
      <TableCell className="whitespace-normal">
        <p className="font-medium">
          {item.make} {item.model}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{item.className}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant={item.published ? "secondary" : "outline"}>
            {item.published ? "Published" : "Unpublished"}
          </Badge>
          {inheritsClassUsd ? (
            <Badge variant="outline">Uses class USD</Badge>
          ) : (
            <Badge variant="secondary">Model USD</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="tabular-nums whitespace-normal">
        {item.classDailyRate > 0 ? formatGhs(item.classDailyRate) : "Unset"}
      </TableCell>
      <TableCell className="whitespace-normal">
        {publishedFrom
          ? formatUsdDailyRate(publishedFrom, publishedTo)
          : "No USD band"}
      </TableCell>
      <TableCell className="whitespace-normal">
        <form action={formAction} className="space-y-3" aria-busy={pending}>
          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          {state?.success ? (
            <p className="text-sm text-success">{state.success}</p>
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={usdFromId}>USD from</Label>
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
              <Label htmlFor={usdToId}>USD to</Label>
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
          </div>
          <p className="text-xs text-muted-foreground">
            Leave both blank to inherit the class band. Lower USD is Accra metro;
            higher is outside Accra.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving..." : "Save USD"}
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href={`/admin/fleet/models/${item.id}`}>Model</Link>
            </Button>
          </div>
        </form>
      </TableCell>
    </TableRow>
  );
}
