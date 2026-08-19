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
  zoomOnHover = false,
}: {
  image: MarketingImage;
  className?: string;
  imgClassName?: string;
  sizes: string;
  priority?: boolean;
  objectPosition?: string;
  zoomOnHover?: boolean;
}) {
  return (
    <figure className={cn("relative overflow-hidden bg-muted", className)}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={sizes}
        className={cn(
          "object-cover",
          zoomOnHover &&
            "transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          imgClassName,
        )}
        style={objectPosition ? { objectPosition } : undefined}
      />
    </figure>
  );
}
