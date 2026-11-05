"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AdminConsoleError({
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
        Staff dashboard
      </p>
      <h1 className="mt-2 font-heading text-3xl tracking-tight">
        This admin page could not load
      </h1>
      <p className="mt-3 text-muted-foreground">
        Your data was not changed. Try loading the page again, or return to the
        dashboard if the issue continues.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">Return to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
