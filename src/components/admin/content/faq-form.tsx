"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/fleet/action-helpers";
import { FAQ_CATEGORIES } from "@/lib/content/faq-categories";

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FaqForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaults?: {
    question: string;
    answer: string;
    category: string;
    sortOrder: number;
    published: boolean;
  };
  submitLabel: string;
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
        <Label htmlFor="question">Question</Label>
        <Input id="question" name="question" required defaultValue={defaults?.question} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="answer">Answer</Label>
        <Textarea id="answer" name="answer" required defaultValue={defaults?.answer} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          name="category"
          className={selectClassName}
          defaultValue={defaults?.category ?? "Booking"}
        >
          {FAQ_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sortOrder">Sort order</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={defaults?.sortOrder ?? 0}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" defaultChecked={defaults?.published} />
        Published
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
