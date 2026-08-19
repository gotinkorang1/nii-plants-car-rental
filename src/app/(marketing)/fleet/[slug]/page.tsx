import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CatalogueDailyRate } from "@/components/fleet/catalogue-daily-rate";
import { FleetCard } from "@/components/fleet/fleet-card";
import { ModelGallery } from "@/components/fleet/model-gallery";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageEyebrow, SectionHeading } from "@/components/marketing/page-intro";
import { PageTrail } from "@/components/marketing/page-trail";
import { Button } from "@/components/ui/button";
import {
  vehicleSeoDescription,
  vehicleSeoTitle,
} from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd, carJsonLd } from "@/lib/content/structured-data";
import { getPublicModel } from "@/lib/fleet/get-public-model";
import { getRelatedModels } from "@/lib/fleet/get-related-models";
import { kwToHp } from "@/lib/vehicle-data/normalize";

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
  const engine =
    model.engineName ??
    (model.engineDisplacementL ? `${model.engineDisplacementL} L` : null);

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
          usdDailyRateFrom: model.usdDailyRateFrom,
          usdDailyRateTo: model.usdDailyRateTo,
        })}
      />
      <PageTrail
        items={[
          { name: "Home", href: "/" },
          { name: "Fleet", href: "/fleet" },
          { name: heading },
        ]}
      />
      <p className="text-sm">
        <Link
          href="/fleet"
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          ← Back to fleet
        </Link>
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <ModelGallery
          heading={heading}
          images={model.images}
          vehicleClass={model.className}
        />
        <div className="space-y-6 lg:sticky lg:top-24">
          <PageEyebrow>{model.className}</PageEyebrow>
          <h1 className="mt-2 font-heading text-4xl tracking-tight">{heading}</h1>
          <p className="text-muted-foreground">
            {COPY.vehicleHireNote}
          </p>
          <p className="text-lg">
            From{" "}
            <CatalogueDailyRate
              usdDailyRateFrom={model.usdDailyRateFrom}
              usdDailyRateTo={model.usdDailyRateTo}
              dailyRatePesewas={model.dailyRatePesewas}
              emphasize
            />
          </p>
          {model.usdDailyRateFrom ? (
            <p className="text-sm text-muted-foreground">
              {COPY.catalogueRateNote}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-4">
              <Link href={`/book?vehicle=${model.slug}`}>Book vehicle</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-4">
              <Link href="/help/requirements">Rental requirements</Link>
            </Button>
          </div>
          <p className="text-sm leading-relaxed">{model.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Spec label="Seats" value={String(model.seats)} />
            <Spec label="Doors" value={String(model.doors)} />
            <Spec
              label="Transmission"
              value={model.transmission}
              capitalize
            />
            <Spec
              label="Fuel"
              value={model.fuelType.replace("_", " ")}
              capitalize
            />
            <Spec label="Luggage" value={String(model.luggage)} />
            <Spec
              label="Air conditioning"
              value={model.airConditioning ? "Yes" : "No"}
            />
            {years ? <Spec label="Years" value={years} /> : null}
            {model.bodyType ? (
              <Spec label="Body" value={model.bodyType} />
            ) : null}
            {model.trimLevel ? (
              <Spec label="Trim" value={model.trimLevel} />
            ) : null}
            {model.driveType ? (
              <Spec label="Drive" value={model.driveType} />
            ) : null}
            {engine ? <Spec label="Engine" value={engine} /> : null}
            {model.powerKw ? (
              <Spec
                label="Power"
                value={`${model.powerKw} kW (${kwToHp(model.powerKw)} hp)`}
              />
            ) : null}
            {model.fuelEconomyLPer100Km ? (
              <Spec
                label="Fuel economy"
                value={`${model.fuelEconomyLPer100Km} L/100 km`}
              />
            ) : null}
            {model.evRangeKm ? (
              <Spec label="Range" value={`${model.evRangeKm} km`} />
            ) : null}
            {model.batteryCapacityKwh ? (
              <Spec label="Battery" value={`${model.batteryCapacityKwh} kWh`} />
            ) : null}
            {model.acChargingKw ? (
              <Spec label="AC charging" value={`${model.acChargingKw} kW`} />
            ) : null}
            {model.dcChargingKw ? (
              <Spec label="DC charging" value={`${model.dcChargingKw} kW`} />
            ) : null}
          </dl>

          {model.customSpecs.length > 0 ? (
            <section aria-labelledby="additional-specs">
              <h2 id="additional-specs" className="font-heading text-xl">
                Additional specifications
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                {model.customSpecs.map((spec) => (
                  <Spec key={spec.label} label={spec.label} value={spec.value} />
                ))}
              </dl>
            </section>
          ) : null}
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-16">
          <SectionHeading title={`Other ${model.className} models`} />
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

function Spec({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl bg-card px-3 py-2 ring-1 ring-border">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={capitalize ? "capitalize" : undefined}>{value}</dd>
    </div>
  );
}
