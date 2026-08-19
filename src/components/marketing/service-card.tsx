import Link from "next/link";

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
        "transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <MarketingPhoto
        image={{ ...image, alt: "" }}
        className="aspect-[16/10]"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      <div className="p-5">
        <Heading className="font-heading text-2xl group-hover:text-primary">
          {title}
        </Heading>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </div>
    </Link>
  );
}
