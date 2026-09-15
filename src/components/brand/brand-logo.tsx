import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** When true, the image is hidden from assistive tech because nearby text names the brand. */
  decorative?: boolean;
};

export function BrandLogo({ className, decorative = false }: BrandLogoProps) {
  return (
    // Official Nii Plants shield artwork.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/nii-plants-logo.png"
      alt={decorative ? "" : "Nii Plants Car Rentals"}
      width={1657}
      height={1610}
      className={cn("h-12 w-auto", className)}
      decoding="async"
    />
  );
}
