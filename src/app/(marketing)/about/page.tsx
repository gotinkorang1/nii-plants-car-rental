import type { Metadata } from "next";
import Link from "next/link";

import { ClienteleLogos } from "@/components/marketing/clientele-logos";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import {
  AWARDS,
  COMPANY,
  MANAGEMENT,
  PAGE_SEO,
} from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
  path: "/about",
});

export default function AboutPage() {

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
        lede={COPY.aboutIntro}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "About" },
        ]}
      />
      <Section className="reveal-stagger grid gap-8 pt-0 lg:grid-cols-2" reveal>
        <article>
          <MarketingPhoto
            image={marketingImages.office}
            className="mb-4 aspect-[4/5] max-h-80 rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
            objectPosition="center 20%"
          />
          <h2 className="font-heading text-2xl">Who we are</h2>
          <p className="mt-3 text-muted-foreground">
            {COPY.aboutStory}
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
            {COPY.howWeHire}
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
            {COPY.awardsNote}
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
            {COPY.group}
          </p>
          <h3 className="mt-6 font-heading text-xl">Mission</h3>
          <p className="mt-2 text-muted-foreground">{COPY.mission}</p>
          <h3 className="mt-6 font-heading text-xl">Vision</h3>
          <p className="mt-2 text-muted-foreground">{COPY.vision}</p>
        </article>
        <article>
          <h2 className="font-heading text-2xl">Chambers and associations</h2>
          <p className="mt-3 text-muted-foreground">
            {COPY.chambers}
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
            {COPY.desks}
          </p>
        </article>
      </Section>
      <Section className="pt-0" reveal>
        <ClienteleLogos />
      </Section>
      <Section className="pt-0" reveal>
        <h2 className="font-heading text-2xl">Pickup points</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Collect in Dansoman, at Kotoka International Airport, at Alisa Hotel
          North Ridge, or at Best Western Plus Atlantic Hotel in Takoradi.{" "}
          {COPY.hours}
        </p>
        <Button asChild className="mt-6">
          <Link href="/contact">Talk to us</Link>
        </Button>
        <p className="mt-4 text-sm">
          <Link href="/gallery" className="text-accent hover:underline">
            Photo gallery
          </Link>
          {" · "}
          <Link href="/news" className="text-accent hover:underline">
            News
          </Link>
        </p>
      </Section>
    </main>
  );
}
