"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RootError({
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
      className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-4 py-16 sm:px-6"
    >
      <p className="text-xs font-medium tracking-wide text-primary uppercase">Error</p>
      <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-3 text-muted-foreground">
        We could not load this page. Please try again or return to the homepage.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </main>
  );
}
