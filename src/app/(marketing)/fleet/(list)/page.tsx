import type { Metadata } from "next";

import { FleetCard } from "@/components/fleet/fleet-card";
import { FleetFilters } from "@/components/fleet/fleet-filters";
import { JsonLd } from "@/components/marketing/json-ld";
import { PAGE_SEO } from "@/lib/content/company";
import { pageMetadata } from "@/lib/content/seo";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
} from "@/lib/content/structured-data";
import { parseFleetSearchParams } from "@/lib/fleet/filters";
import {
  getPublicActiveClasses,
  getPublicModels,
} from "@/lib/fleet/get-public-models";

export const dynamic = "force-dynamic";

type FleetPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.fleet.title,
  description: PAGE_SEO.fleet.description,
  path: "/fleet",
});

export default async function FleetPage({ searchParams }: FleetPageProps) {
  const params = await searchParams;
  const filters = parseFleetSearchParams(params);
  const [models, classes] = await Promise.all([
    getPublicModels(filters),
    getPublicActiveClasses(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Fleet", path: "/fleet" },
        ])}
      />
      {models.length > 0 ? (
        <JsonLd
          data={itemListJsonLd(
            models.map((model) => ({
              name: `${model.make} ${model.modelName}`,
              path: `/fleet/${model.slug}`,
            })),
          )}
        />
      ) : null}
      <header className="max-w-2xl space-y-3">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          Car hire fleet, Accra
        </p>
        <h1 className="font-heading text-4xl tracking-tight sm:text-5xl">
          Cars to hire in Accra: saloons, SUVs, 4x4s and coaches
        </h1>
        <p className="text-base text-muted-foreground">
          You book a representative model or similar, not a registration plate.
          Staff assign the physical car. Rates are quoted in Ghana cedis before
          you pay.
        </p>
      </header>

      <div className="mt-8">
        <FleetFilters classes={classes} filters={filters} />
      </div>

      {models.length === 0 ? (
        <p className="mt-10 rounded-2xl bg-card p-8 text-sm text-muted-foreground ring-1 ring-border">
          No cars match these filters. Try another class or seat count.
        </p>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {models.map((model) => (
            <li key={model.id}>
              <FleetCard model={model} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
