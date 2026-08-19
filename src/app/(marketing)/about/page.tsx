import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import {
  AWARDS,
  COMPANY,
  MANAGEMENT,
  MEMBERSHIPS,
  PAGE_SEO,
} from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
  path: "/about",
});

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <PageBanner
        image={marketingImages.executiveBanner}
        eyebrow="About"
        title="Car rental in Accra since 2007"
        lede={`${settings.businessName} is a Ghanaian-owned hire company based at Plantsville, Dansoman. ${COMPANY.tagline}.`}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "About" },
        ]}
      />
      <Section className="grid gap-8 pt-0 lg:grid-cols-2">
        <article>
          <MarketingPhoto
            image={marketingImages.office}
            className="mb-4 aspect-[4/5] max-h-80 rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
            objectPosition="center 20%"
          />
          <h2 className="font-heading text-2xl">Who we are</h2>
          <p className="mt-3 text-muted-foreground">
            {COMPANY.legalName} was incorporated on 22 October 2007 under the
            Companies Code, 1963 (Act 179), and commenced business the following
            day. Theophilus Ayitey-Adjin and Mary Ayitey-Adjin own the company
            equally. We hire saloons, SUVs, 4x4s, vans, and coaches for travel
            inside Ghana.
          </p>
        </article>
        <article>
          <MarketingPhoto
            image={marketingImages.driving}
            className="mb-4 aspect-[16/10] rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <h2 className="font-heading text-2xl">Leadership</h2>
          <p className="mt-3 text-muted-foreground">
            {MANAGEMENT.managingDirector.name} is{" "}
            {MANAGEMENT.managingDirector.role.toLowerCase()}. He holds{" "}
            {MANAGEMENT.managingDirector.credentials}. He is also{" "}
            {MANAGEMENT.managingDirector.industryRole}.
          </p>
          <p className="mt-3 text-muted-foreground">
            {MANAGEMENT.deputyManagingDirector.name} is{" "}
            {MANAGEMENT.deputyManagingDirector.role.toLowerCase()}.{" "}
            {MANAGEMENT.deputyManagingDirector.credentials}.
          </p>
        </article>
        <article>
          <MarketingPhoto
            image={marketingImages.workshop}
            className="mb-4 aspect-[16/10] rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <h2 className="font-heading text-2xl">How we hire cars</h2>
          <p className="mt-3 text-muted-foreground">
            You book a model or similar. Staff assign a physical car. Self-drive
            days are 24 hours. Chauffeur hire uses a 10-hour duty day, with a
            three-hour minimum for short jobs. Airport, long-term, and group
            trips are arranged with staff. Mileage for ordinary use inside Ghana
            is included.
          </p>
        </article>
        <article>
          <h2 className="font-heading text-2xl">Awards</h2>
          <ul className="mt-4 grid gap-3">
            {AWARDS.map((item) => (
              <li
                key={`${item.year}-${item.name}`}
                className="rounded-2xl bg-card p-5 ring-1 ring-border"
              >
                <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                  {item.year}
                </p>
                <p className="mt-2 font-medium">{item.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.issuer}
                  {"venue" in item && item.venue ? `, ${item.venue}` : ""}.{" "}
                  {item.dateLabel}.
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-muted-foreground">
            JoyOnline and Daily Guide reported the 2022 citation: a fleet of
            cross-country vehicles, safe travel in and outside Accra, and
            professional drivers. We do not invent review scores or “best in
            Ghana” as a standing slogan — those titles belong to the award
            ceremonies.
          </p>
        </article>
        <article>
          <h2 className="font-heading text-2xl">From Sakaman to Plantsville</h2>
          <ol className="mt-4 space-y-4 border-l border-accent/40 pl-5">
            <li>
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                2007
              </p>
              <p className="mt-1 text-muted-foreground">
                Incorporated on 22 October and started hire the next day from
                Sakaman Junction on the Odorkor–Mallam Highway.
              </p>
            </li>
            <li>
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                2021
              </p>
              <p className="mt-1 text-muted-foreground">
                Opened the Plantsville office in Dansoman on 1 October, covered
                by AmCham Ghana. The complex includes five furnished apartments
                for visiting hire clients — booked with staff, not as part of a
                self-drive checkout.
              </p>
            </li>
            <li>
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                Today
              </p>
              <p className="mt-1 text-muted-foreground">
                Collect in Dansoman, at Kotoka, at Alisa Hotel North Ridge, or
                at Best Western Plus Atlantic Hotel in Takoradi. Postal mail:{" "}
                {COMPANY.postalBox}.
              </p>
            </li>
          </ol>
        </article>
        <article>
          <h2 className="font-heading text-2xl">Nii Plants Group</h2>
          <p className="mt-3 text-muted-foreground">
            The group also includes NiiPlants Logistics (haulage from 2020),
            Puffs Ghana Limited, and Plantsville Residences in Dansoman. Trucks
            and earth-moving sit with logistics, not this car-rental site.
          </p>
        </article>
        <article>
          <h2 className="font-heading text-2xl">Chambers and associations</h2>
          <p className="mt-3 text-muted-foreground">
            {MEMBERSHIPS[0].short} lists Nii Plants Group as a member. AmCham
            Ghana published a company profile in 2021 and covered the
            Plantsville opening. In May 2022 the Canada Ghana Chamber of
            Commerce featured Nii Plants at an in-house presentation.
          </p>
        </article>
        <article>
          <MarketingPhoto
            image={marketingImages.cabin}
            className="mb-4 aspect-[16/10] rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <h2 className="font-heading text-2xl">Accra and Takoradi desks</h2>
          <p className="mt-3 text-muted-foreground">
            Besides Plantsville and Kotoka, Modern Ghana reported desks at Alisa
            Hotel North Ridge for Accra hotel guests and corporates, and at Best
            Western Plus Atlantic Hotel in Takoradi for the Western and Western
            North regions.
          </p>
        </article>
      </Section>
      <Section className="pt-0">
        <h2 className="font-heading text-2xl">Pickup points</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Collect in Dansoman, at Kotoka International Airport, at Alisa Hotel
          North Ridge, or at Best Western Plus Atlantic Hotel in Takoradi. The
          office is open {COMPANY.openingHoursDisplay}.
        </p>
        <Button asChild className="mt-6">
          <Link href="/contact">Talk to us</Link>
        </Button>
      </Section>
    </main>
  );
}
