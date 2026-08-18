import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { VehicleImageFallback } from "@/components/fleet/vehicle-image-fallback";
import { MoneyDisplay } from "@/components/money/money-display";
import type { AvailableModelResult } from "@/lib/availability/get-available-models";
import { bookingSearchQuery } from "@/lib/booking/search-params";
import { formatGhs } from "@/lib/money";
import type { AvailabilitySearchInput } from "@/lib/validation/availability";

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
      {models.map((model) => (
        <li key={model.modelId}>
          <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(24,26,24,0.06)] ring-1 ring-border">
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              {model.image?.url ? (
                <Image
                  src={model.image.url}
                  alt={model.image.altText}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <VehicleImageFallback vehicleClass={model.className} />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div>
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  {model.className}
                </p>
                <h2 className="mt-1 font-heading text-2xl leading-tight">
                  {model.make} {model.model}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">or similar</p>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Seats</dt>
                  <dd>{model.seats}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Transmission</dt>
                  <dd className="capitalize">{model.transmission}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Luggage</dt>
                  <dd>{model.luggage}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Air conditioning</dt>
                  <dd>{model.airConditioning ? "Yes" : "No"}</dd>
                </div>
              </dl>
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
              <Button asChild className="mt-auto">
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
