import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import { PageIntro, Section } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import {
  AWARDS,
  COMPANY,
  MANAGEMENT,
  MEMBERSHIPS,
  PAGE_SEO,
} from "@/lib/content/company";
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
      <Section className="pt-10">
        <PageIntro
          eyebrow="About"
          title="Car rental in Accra since 2007"
          lede={`${settings.businessName} is a Ghanaian-owned hire company based at Plantsville, Dansoman. ${COMPANY.tagline}.`}
        />
      </Section>
      <Section className="grid gap-8 pt-0 lg:grid-cols-2">
        <article>
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
          <ul className="mt-3 space-y-3 text-muted-foreground">
            {AWARDS.map((item) => (
              <li key={`${item.year}-${item.name}`}>
                <span className="font-medium text-foreground">
                  {item.year}: {item.name}.
                </span>{" "}
                {item.issuer}
                {"venue" in item && item.venue ? `, ${item.venue}` : ""}.{" "}
                {item.dateLabel}.
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
          <p className="mt-3 text-muted-foreground">
            The company first operated from Sakaman Junction on the
            Odorkor–Mallam Highway. On 1 October 2021 it opened the Plantsville
            office in Dansoman, covered by AmCham Ghana. The complex includes
            five furnished one- and two-bedroom apartments for visiting hire
            clients — booked with staff, not as part of a self-drive checkout.
            Postal mail: {COMPANY.postalBox}.
          </p>
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
