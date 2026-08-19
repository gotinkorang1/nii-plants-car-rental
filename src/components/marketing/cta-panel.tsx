import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaPanel({
  title,
  body,
  primaryHref = "/book",
  primaryLabel = "Book a Vehicle",
  secondaryHref = "/contact",
  secondaryLabel = "Contact",
  className,
}: {
  title: string;
  body: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-primary px-6 py-8 text-primary-foreground sm:px-8",
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-accent"
      />
      <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div className="max-w-xl">
          <h2 className="font-heading text-2xl sm:text-3xl">{title}</h2>
          <p className="mt-2 text-sm text-primary-foreground/80">{body}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="lg" variant="secondary" className="h-11 px-4">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 px-4 border-white/35 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <Link href={secondaryHref}>{secondaryLabel}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
