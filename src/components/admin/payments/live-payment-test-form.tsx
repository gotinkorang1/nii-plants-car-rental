"use client";

import { useState, useTransition, type FormEvent } from "react";

import { initializeLivePaymentTest } from "@/lib/payments/live-test-action";
import { formatGhs } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LivePaymentTestForm({
  defaultEmail,
  defaultPhone,
}: {
  defaultEmail: string;
  defaultPhone: string;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await initializeLivePaymentTest({}, formData);
      if (result.authorizationUrl) {
        window.location.assign(result.authorizationUrl);
        return;
      }
      setError(result.error ?? "Could not start the live payment test.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="rounded-xl bg-muted/50 p-4 text-sm">
        <p className="font-semibold">Live amount: {formatGhs(300)}</p>
        <p className="mt-1 text-muted-foreground">
          This opens Paystack hosted checkout and can charge the live account. Use only with the approved test details.
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="live-test-email" className="text-sm font-medium">Email</label>
        <Input id="live-test-email" name="email" type="email" defaultValue={defaultEmail} required />
      </div>
      <div className="space-y-2">
        <label htmlFor="live-test-phone" className="text-sm font-medium">Mobile number</label>
        <Input id="live-test-phone" name="phone" type="tel" defaultValue={defaultPhone} required />
      </div>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Opening Paystack…" : "Open GH₵3 hosted checkout"}
      </Button>
    </form>
  );
}
