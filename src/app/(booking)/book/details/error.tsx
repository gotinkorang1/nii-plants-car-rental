"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function BookingDetailsError({
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
      className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col justify-center px-4 py-16"
    >
      <p className="text-xs font-medium tracking-wide text-primary uppercase">
        Booking details
      </p>
      <h1 className="mt-2 font-heading text-3xl tracking-tight">
        We could not load this booking step
      </h1>
      <p className="mt-3 text-muted-foreground">
        Your booking was not changed. Try again, or return to availability to
        start a fresh vehicle hold.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/book">Check availability</Link>
        </Button>
      </div>
    </main>
  );
}
