import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** When true, the image is hidden from assistive tech because nearby text names the brand. */
  decorative?: boolean;
};

export function BrandLogo({ className, decorative = false }: BrandLogoProps) {
  return (
    // SVG keeps the shield, type, and car strokes sharp at any size.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/nii-plants-logo.svg"
      alt={decorative ? "" : "Nii Plants Car Rentals"}
      width={100}
      height={98}
      className={cn("h-12 w-auto", className)}
      decoding="async"
    />
  );
}
