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
        "flex flex-col items-start justify-between gap-5 rounded-2xl bg-card p-6 ring-1 ring-border sm:flex-row sm:items-center",
        className,
      )}
    >
      <div>
        <h2 className="font-heading text-2xl">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="lg">
          <Link href={primaryHref}>{primaryLabel}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={secondaryHref}>{secondaryLabel}</Link>
        </Button>
      </div>
    </div>
  );
}
