import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import type { MarketingImage } from "@/lib/content/marketing-images";
import { cn } from "@/lib/utils";

export function ServiceCard({
  href,
  title,
  body,
  image,
  headingLevel = "h2",
}: {
  href: string;
  title: string;
  body: string;
  image: MarketingImage;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  return (
    <Link
      href={href}
      className={cn(
        "group block h-full overflow-hidden rounded-2xl bg-card ring-1 ring-border",
        "transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(24,26,24,0.08)]",
        "focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <MarketingPhoto
        image={{ ...image, alt: "" }}
        className="aspect-[16/10]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        zoomOnHover
      />
      <span className="block h-0.5 bg-accent" aria-hidden />
      <div className="p-5">
        <Heading className="font-heading text-2xl transition-colors group-hover:text-accent">
          {title}
        </Heading>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-accent">
          Learn more
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
        </p>
      </div>
    </Link>
  );
}
