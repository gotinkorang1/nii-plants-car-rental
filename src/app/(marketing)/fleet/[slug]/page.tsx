import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FleetCard } from "@/components/fleet/fleet-card";
import { ModelGallery } from "@/components/fleet/model-gallery";
import { JsonLd } from "@/components/marketing/json-ld";
import { Button } from "@/components/ui/button";
import {
  vehicleSeoDescription,
  vehicleSeoTitle,
} from "@/lib/content/company";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd, carJsonLd } from "@/lib/content/structured-data";
import { getPublicModel } from "@/lib/fleet/get-public-model";
import { getRelatedModels } from "@/lib/fleet/get-related-models";
import { formatGhs } from "@/lib/money";

export const dynamic = "force-dynamic";

type VehicleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const model = await getPublicModel(slug);

  if (!model) {
    notFound();
  }

  const title = vehicleSeoTitle(model.make, model.modelName);
  const description = vehicleSeoDescription({
    make: model.make,
    modelName: model.modelName,
    className: model.className,
    description: model.description,
    seats: model.seats,
  });

  return pageMetadata({
    title,
    description,
    path: `/fleet/${model.slug}`,
    images: model.primaryImage?.url ? [model.primaryImage.url] : undefined,
  });
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  const { slug } = await params;
  const model = await getPublicModel(slug);

  if (!model) {
    notFound();
  }

  const related = await getRelatedModels(model);
  const heading = `${model.make} ${model.modelName}`;
  const years =
    model.yearFrom || model.yearTo
      ? [model.yearFrom, model.yearTo].filter(Boolean).join("–")
      : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Fleet", path: "/fleet" },
          { name: heading, path: `/fleet/${model.slug}` },
        ])}
      />
      <JsonLd
        data={carJsonLd({
          name: heading,
          make: model.make,
          description: model.description,
          seats: model.seats,
          transmission: model.transmission,
          fuelType: model.fuelType,
          slug: model.slug,
          imageUrl: model.primaryImage?.url ?? undefined,
          dailyRatePesewas: model.dailyRatePesewas,
        })}
      />
      <p className="text-sm">
        <Link href="/fleet" className="text-primary hover:underline">
          Back to fleet
        </Link>
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <ModelGallery heading={heading} images={model.images} />
        <div className="space-y-6">
          <p className="text-sm font-medium tracking-wide text-primary uppercase">
            {model.className}
          </p>
          <h1 className="font-heading text-4xl tracking-tight">{heading}</h1>
          <p className="text-muted-foreground">
            Hire this {model.className.toLowerCase()} in Accra as this model or
            similar. Staff assign the physical car at pickup.
          </p>
          <p className="text-lg">
            From{" "}
            <strong>
              {model.dailyRatePesewas > 0
                ? formatGhs(model.dailyRatePesewas)
                : "quote on request"}
            </strong>
            <span className="text-muted-foreground"> / day</span>
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href={`/book?vehicle=${model.slug}`}>Book vehicle</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/help/requirements">Rental requirements</Link>
            </Button>
          </div>
          <p className="text-sm leading-relaxed">{model.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Spec label="Seats" value={String(model.seats)} />
            <Spec label="Doors" value={String(model.doors)} />
            <Spec label="Transmission" value={model.transmission} />
            <Spec label="Fuel" value={model.fuelType.replace("_", " ")} />
            <Spec label="Luggage" value={String(model.luggage)} />
            <Spec
              label="Air conditioning"
              value={model.airConditioning ? "Yes" : "No"}
            />
            {years ? <Spec label="Years" value={years} /> : null}
          </dl>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-heading text-2xl">Other {model.className} models</h2>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {related.map((item) => (
              <li key={item.id}>
                <FleetCard model={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card px-3 py-2 ring-1 ring-border">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="capitalize">{value}</dd>
    </div>
  );
}
