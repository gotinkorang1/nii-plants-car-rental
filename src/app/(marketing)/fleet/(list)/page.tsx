import type { Metadata } from "next";
import Link from "next/link";

import { FleetCard } from "@/components/fleet/fleet-card";
import { FleetFilters } from "@/components/fleet/fleet-filters";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { PAGE_SEO } from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
} from "@/lib/content/structured-data";
import {
  hasActivePublicFleetFilters,
  parseFleetSearchParams,
} from "@/lib/fleet/filters";
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
    <main>
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
      <PageBanner
        image={marketingImages.driving}
        eyebrow="Car hire fleet, Accra"
        title="Cars to hire in Accra: saloons, SUVs, 4x4s and coaches"
        lede={COPY.fleetLede}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Fleet" },
        ]}
        compact
      />

      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-8 sm:px-6">
        <FleetFilters classes={classes} filters={filters} />

        {models.length === 0 ? (
          <div className="mt-10 rounded-2xl bg-card p-8 ring-1 ring-border">
            <h2 className="font-heading text-2xl">No cars match these filters</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Try another class or seat count
              {hasActivePublicFleetFilters(filters)
                ? ", or clear the filters to see every published model."
                : ". Published models will appear here once staff list them."}
            </p>
            {hasActivePublicFleetFilters(filters) ? (
              <p className="mt-4 text-sm">
                <Link href="/fleet" className="text-primary hover:underline">
                  Clear filters
                </Link>
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <p className="mt-8 text-sm text-muted-foreground">
              {models.length} {models.length === 1 ? "model" : "models"} published
              for hire.
            </p>
            <ul className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {models.map((model) => (
                <li key={model.id} className="reveal-on-scroll">
                  <FleetCard model={model} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
