import Link from "next/link";

import { cn } from "@/lib/utils";

export type PageTrailItem = {
  name: string;
  href?: string;
};

export function PageTrail({ items }: { items: PageTrailItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center gap-x-1.5">
              {index > 0 ? (
                <span aria-hidden className="text-accent/70">
                  /
                </span>
              ) : null}
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className="transition-colors hover:text-primary"
                >
                  {item.name}
                </Link>
              ) : (
                <span
                  className={cn(last && "text-foreground")}
                  aria-current={last ? "page" : undefined}
                >
                  {item.name}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
