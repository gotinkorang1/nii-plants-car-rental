"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function PaymentCallbackError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center px-6 py-16"
    >
      <p className="text-xs font-medium tracking-wide text-primary uppercase">Payment</p>
      <h1 className="mt-2 font-heading text-3xl tracking-tight">
        Payment status could not be confirmed
      </h1>
      <p className="mt-3 text-muted-foreground">
        Do not pay again yet. Try checking the status once more or access your
        booking and contact us if the payment remains unclear.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/booking">Access your booking</Link>
        </Button>
      </div>
    </main>
  );
}
