import Link from "next/link";

import { FleetCard } from "@/components/fleet/fleet-card";
import { SectionHeading } from "@/components/marketing/page-intro";
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
      <SectionHeading
        id="featured-vehicles-heading"
        title={title}
        action={
          <Link href="/fleet" className="text-sm font-medium text-primary hover:underline">
            All vehicles
          </Link>
        }
      />
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
