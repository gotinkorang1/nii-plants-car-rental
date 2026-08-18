import Link from "next/link";

import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
      <p className="text-xs font-medium tracking-wide text-primary uppercase">404</p>
      <h1 className="mt-2 font-heading text-3xl tracking-tight sm:text-4xl">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        This page is unpublished, inactive, or does not exist. Try browsing the fleet or
        contacting our team.
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/fleet">Browse fleet</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </main>
  );
}
