import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { VehicleImageFallback } from "@/components/fleet/vehicle-image-fallback";
import { MoneyDisplay } from "@/components/money/money-display";
import type { PublicVehicleModel } from "@/lib/fleet/public-types";

export function FleetCard({ model }: { model: PublicVehicleModel }) {
  const image = model.primaryImage;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card shadow-[0_1px_2px_rgba(24,26,24,0.06)] ring-1 ring-border transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(24,26,24,0.08)] focus-within:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.altText}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
            {model.make} {model.modelName}
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
            <dt className="text-muted-foreground">Fuel</dt>
            <dd className="capitalize">{model.fuelType.replace("_", " ")}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Air conditioning</dt>
            <dd>{model.airConditioning ? "Yes" : "No"}</dd>
          </div>
        </dl>
        <p className="mt-auto text-sm">
          From{" "}
          <MoneyDisplay
            amountPesewas={model.dailyRatePesewas}
            suffix="/ day"
            emphasize
            placeholder="quote on request"
          />
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/fleet/${model.slug}`}>View vehicle</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/book?vehicle=${model.slug}`}>Book a Vehicle</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
