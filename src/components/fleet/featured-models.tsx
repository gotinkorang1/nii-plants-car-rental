import { FleetCard } from "@/components/fleet/fleet-card";
import type { PublicVehicleModel } from "@/lib/fleet/public-types";

export function FeaturedModels({
  models,
  title = "Cars to hire in Accra",
}: {
  models: PublicVehicleModel[];
  title?: string;
}) {
  if (models.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="featured-vehicles-heading">
      <h2
        id="featured-vehicles-heading"
        className="font-heading text-2xl tracking-tight"
      >
        {title}
      </h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {models.map((model) => (
          <li key={model.id}>
            <FleetCard model={model} />
          </li>
        ))}
      </ul>
    </section>
  );
}
