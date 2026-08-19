import Image from "next/image";

import type { MarketingImage } from "@/lib/content/marketing-images";
import { cn } from "@/lib/utils";

export function MarketingPhoto({
  image,
  className,
  imgClassName,
  sizes,
  priority = false,
  objectPosition,
}: {
  image: MarketingImage;
  className?: string;
  imgClassName?: string;
  sizes: string;
  priority?: boolean;
  objectPosition?: string;
}) {
  return (
    <figure className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn("object-cover", imgClassName)}
        style={objectPosition ? { objectPosition } : undefined}
      />
    </figure>
  );
}
