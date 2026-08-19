import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogueDailyRate } from "@/components/fleet/catalogue-daily-rate";
import { VehicleImageFallback } from "@/components/fleet/vehicle-image-fallback";
import type { PublicVehicleModel } from "@/lib/fleet/public-types";
import { cn } from "@/lib/utils";

export function FleetCard({ model }: { model: PublicVehicleModel }) {
  const image = model.primaryImage;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border",
        "shadow-[0_1px_2px_rgba(24,26,24,0.06)] transition-[transform,box-shadow] duration-300",
        "hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(24,26,24,0.08)]",
        "focus-within:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.altText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <VehicleImageFallback vehicleClass={model.className} />
        )}
        {image?.url ? (
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 h-auto rounded-full bg-background/90 px-2.5 py-1 text-[0.7rem] font-medium tracking-[0.14em] text-primary uppercase backdrop-blur-sm"
          >
            {model.className}
          </Badge>
        ) : null}
      </div>
      <span className="block h-0.5 shrink-0 bg-accent" aria-hidden />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <h2 className="font-heading text-2xl leading-tight">
            {model.make} {model.modelName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">or similar</p>
        </div>
        <ul className="flex flex-wrap gap-2 text-xs">
          <SpecChip>{model.seats} seats</SpecChip>
          <SpecChip className="capitalize">{model.transmission}</SpecChip>
          <SpecChip className="capitalize">
            {model.fuelType.replace("_", " ")}
          </SpecChip>
          <SpecChip>
            {model.airConditioning ? "Air conditioning" : "No A/C"}
          </SpecChip>
        </ul>
        <p className="mt-auto text-sm">
          From{" "}
          <CatalogueDailyRate
            usdDailyRateFrom={model.usdDailyRateFrom}
            usdDailyRateTo={model.usdDailyRateTo}
            dailyRatePesewas={model.dailyRatePesewas}
            emphasize
          />
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="h-11 flex-1">
            <Link href={`/fleet/${model.slug}`}>View vehicle</Link>
          </Button>
          <Button asChild className="h-11 flex-1">
            <Link href={`/book?vehicle=${model.slug}`}>Book a Vehicle</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function SpecChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <li>
      <Badge
        variant="secondary"
        className={cn(
          "h-auto rounded-full px-2.5 py-1 font-normal text-muted-foreground",
          className,
        )}
      >
        {children}
      </Badge>
    </li>
  );
}
