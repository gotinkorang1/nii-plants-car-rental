import Image from "next/image";
import Link from "next/link";
import { Armchair, Briefcase, Cog, Snowflake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VehicleImageFallback } from "@/components/fleet/vehicle-image-fallback";
import { MoneyDisplay } from "@/components/money/money-display";
import type { AvailableModelResult } from "@/lib/availability/get-available-models";
import { bookingSearchQuery } from "@/lib/booking/search-params";
import { formatGhs } from "@/lib/money";
import type { AvailabilitySearchInput } from "@/lib/validation/availability";
import { cn } from "@/lib/utils";

export function AvailabilityResults({
  models,
  search,
}: {
  models: AvailableModelResult[];
  search: AvailabilitySearchInput;
}) {
  const query = bookingSearchQuery(search);

  return (
    <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {models.map((model, index) => (
        <li
          key={model.modelId}
          className="animate-booking-enter"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <article
            className={cn(
              "group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border",
              "shadow-[0_1px_2px_rgba(24,26,24,0.06)] transition-[transform,box-shadow] duration-300",
              "hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(24,26,24,0.08)]",
              "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
            )}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {model.image?.url ? (
                <Image
                  src={model.image.url}
                  alt={model.image.altText}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              ) : (
                <VehicleImageFallback vehicleClass={model.className} />
              )}
              {model.image?.url ? (
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
                  {model.make} {model.model}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">or similar</p>
              </div>
              <ul className="flex flex-wrap gap-2 text-xs">
                <li>
                  <Badge variant="secondary" className="flex h-auto items-center gap-1 rounded-full px-2.5 py-1 font-normal text-muted-foreground">
                    <Armchair className="size-3.5" />
                    {model.seats} seats
                  </Badge>
                </li>
                <li>
                  <Badge variant="secondary" className="flex h-auto items-center gap-1 rounded-full px-2.5 py-1 font-normal capitalize text-muted-foreground">
                    <Cog className="size-3.5" />
                    {model.transmission}
                  </Badge>
                </li>
                <li>
                  <Badge variant="secondary" className="flex h-auto items-center gap-1 rounded-full px-2.5 py-1 font-normal text-muted-foreground">
                    <Briefcase className="size-3.5" />
                    {model.luggage} luggage
                  </Badge>
                </li>
                <li>
                  <Badge variant="secondary" className="flex h-auto items-center gap-1 rounded-full px-2.5 py-1 font-normal text-muted-foreground">
                    <Snowflake className="size-3.5" />
                    {model.airConditioning ? "A/C" : "No A/C"}
                  </Badge>
                </li>
              </ul>
              <p className="text-sm">
                <MoneyDisplay
                  amountPesewas={model.dailyRate}
                  suffix="/ day"
                  emphasize
                />
              </p>
              <p className="text-sm text-muted-foreground">
                {model.chargeableDays} chargeable{" "}
                {model.chargeableDays === 1 ? "day" : "days"} · estimated{" "}
                <span className="font-medium text-foreground">
                  {formatGhs(model.estimatedTotal)}
                </span>
              </p>
              <Button asChild className="mt-auto h-11 bg-accent text-accent-foreground hover:bg-accent/90" size="lg">
                <Link href={`/book/vehicle/${model.slug}?${query}`}>
                  Select vehicle
                </Link>
              </Button>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
