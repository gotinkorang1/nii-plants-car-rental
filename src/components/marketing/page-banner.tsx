import Link from "next/link";

import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import type { MarketingImage } from "@/lib/content/marketing-images";
import { cn } from "@/lib/utils";

export type PageBannerBreadcrumb = { name: string; href?: string };

export function PageBanner({
  image,
  eyebrow,
  title,
  lede,
  breadcrumbs,
  children,
  compact = false,
}: {
  image: MarketingImage;
  eyebrow?: string;
  title: string;
  lede?: string;
  breadcrumbs?: PageBannerBreadcrumb[];
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative isolate -mt-16 overflow-hidden",
        compact ? "min-h-[18rem] sm:min-h-[20rem]" : "min-h-[22rem] sm:min-h-[26rem]",
      )}
    >
      <MarketingPhoto
        image={image}
        className="absolute inset-0 h-full"
        sizes="100vw"
        priority
      />

      {/* Multi-layer gradient for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(24,26,24,0.82)_0%,rgba(36,88,68,0.55)_50%,rgba(24,26,24,0.40)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/60 to-transparent" />

      {/* Copper accent line at very top */}
      <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-accent" aria-hidden />

      {/* Decorative corner flourish */}
      <div className="absolute top-16 right-0 h-40 w-40 rounded-full bg-accent/[0.06] blur-3xl" aria-hidden />
      <div className="absolute bottom-0 left-0 h-32 w-56 rounded-full bg-primary/[0.12] blur-3xl" aria-hidden />

      <div
        className={cn(
          "relative mx-auto flex max-w-6xl flex-col justify-end px-4 sm:px-6",
          compact ? "pb-10 pt-24 sm:pt-28" : "pb-12 pt-28 sm:pb-14 sm:pt-32",
        )}
      >
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-white/60">
              {breadcrumbs.map((item, index) => {
                const last = index === breadcrumbs.length - 1;
                return (
                  <li key={`${item.name}-${index}`} className="flex items-center gap-x-1.5">
                    {index > 0 ? (
                      <span aria-hidden className="text-accent/70">/</span>
                    ) : null}
                    {item.href && !last ? (
                      <Link
                        href={item.href}
                        className="transition-colors hover:text-white"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span
                        className={cn(last && "text-white/90")}
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
        ) : null}

        <div className="max-w-2xl space-y-3">
          {eyebrow ? (
            <p className="flex items-center gap-2.5 text-xs font-medium tracking-[0.16em] text-accent uppercase sm:text-sm">
              <span className="h-px w-6 bg-accent" aria-hidden />
              {eyebrow}
            </p>
          ) : null}

          <h1 className="font-heading text-3xl tracking-tight text-white sm:text-5xl">
            {title}
          </h1>

          {lede ? (
            <p className="max-w-xl text-base text-white/80 sm:text-lg">
              {lede}
            </p>
          ) : null}
        </div>

        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  );
}
