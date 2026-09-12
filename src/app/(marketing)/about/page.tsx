import type { Metadata } from "next";
import Link from "next/link";

import { ClienteleLogos } from "@/components/marketing/clientele-logos";
import { CtaPanel } from "@/components/marketing/cta-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import {
  AWARDS,
  COMPANY,
  GROUP_OUTFITS,
  MANAGEMENT,
  MEMBERSHIPS,
  PAGE_SEO,
} from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import { autoRentalJsonLd, breadcrumbJsonLd } from "@/lib/content/structured-data";
import { mailHref, telHref } from "@/lib/settings/public-contact";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.about.title,
  description: PAGE_SEO.about.description,
  path: "/about",
});

const aboutNav = [
  { href: "#who", label: "Who we are" },
  { href: "#affiliations", label: "Affiliations" },
  { href: "#leadership", label: "Team" },
  { href: "#hire", label: "How we hire" },
  { href: "#packages", label: "Packages" },
  { href: "#awards", label: "Awards" },
  { href: "#history", label: "History" },
  { href: "#group", label: "Group" },
  { href: "#pickup", label: "Visit" },
  { href: "#clientele", label: "Clientele" },
] as const;

const history = [
  {
    year: "2007",
    body: "Incorporated on 22 October as Nii Plants Car Rentals Co. Ltd. Certificate to commence business the next day. Hire started from Sakaman Junction on the Odorkor–Mallam Highway.",
  },
  {
    year: "2020",
    body: "NiiPlants Logistics began haulage, and Puffs Ghana Limited opened. Trucks, cargo, and earth-moving stay with logistics, not this car-rental site.",
  },
  {
    year: "2021",
    body: "Opened the Plantsville office in Dansoman on 1 October, covered by AmCham Ghana. The campus has offices, a front desk, and five furnished apartments for visiting hire clients — booked with staff, not as part of a self-drive checkout.",
  },
  {
    year: "Today",
    body: `Collect in Dansoman, at Kotoka, at Alisa Hotel North Ridge, or at Best Western Plus Atlantic Hotel in Takoradi. Postal mail: ${COMPANY.postalBox}.`,
  },
] as const;

const pickupPoints = [
  {
    name: "Plantsville, Dansoman",
    detail: COMPANY.openingHoursDisplay,
  },
  {
    name: "Kotoka International Airport",
    detail: COMPANY.airportHoursNote,
  },
  {
    name: "Alisa Hotel, North Ridge",
    detail: "Accra hotel guests and corporates.",
  },
  {
    name: "Best Western Plus Atlantic Hotel",
    detail: "Takoradi, for the Western and Western North regions.",
  },
] as const;

const teamPhotos = {
  theo: marketingImages.theo,
  emma: marketingImages.emma,
  daniel: marketingImages.daniel,
  kingdom: marketingImages.kingdom,
} as const;

export default function AboutPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />
      <JsonLd data={autoRentalJsonLd({ description: PAGE_SEO.about.description })} />
      <PageBanner
        image={marketingImages.executiveBanner}
        eyebrow="About"
        title="Car rental in Accra since 2007"
        lede={COPY.aboutIntro}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "About" },
        ]}
      />

      <nav
        aria-label="On this page"
        className="sticky top-16 z-20 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
      >
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 sm:px-6">
          {aboutNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      <Section id="who" className="scroll-mt-32" reveal>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <MarketingPhoto
            image={marketingImages.office}
            className="aspect-[4/5] max-h-[28rem] rounded-2xl lg:max-h-none"
            sizes="(max-width: 1024px) 100vw, 42vw"
            objectPosition="center 18%"
          />
          <div>
            <SectionHeading title="Who we are" />
            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">
              {COPY.aboutStory}
            </p>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
              {COPY.objects}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              <Link href="/fleet" className="text-accent hover:underline">
                Browse the fleet
              </Link>
              {" · "}
              <Link href="/help" className="text-accent hover:underline">
                Hire rules
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section id="affiliations" className="scroll-mt-32 pt-0" reveal>
        <SectionHeading title="Affiliations" />
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {COPY.chambers}
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {MEMBERSHIPS.map((item) => (
            <li
              key={item.short}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
                {item.status}
              </p>
              <h3 className="mt-3 font-heading text-xl">{item.short}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.name}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="leadership" className="scroll-mt-32 pt-0" reveal>
        <SectionHeading title="Management team" />
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {COPY.managementTeam}
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MANAGEMENT.team.map((member) => (
            <li
              key={member.name}
              className="overflow-hidden rounded-2xl bg-card ring-1 ring-border"
            >
              <MarketingPhoto
                image={teamPhotos[member.photo]}
                className="aspect-[4/5]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                objectPosition="center 12%"
              />
              <div className="p-4">
                <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
                  {member.role}
                </p>
                <p className="mt-2 font-heading text-xl">{member.name}</p>
              </div>
            </li>
          ))}
        </ul>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          <li className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
              {MANAGEMENT.managingDirector.role}
            </p>
            <h3 className="mt-3 font-heading text-2xl">
              {MANAGEMENT.managingDirector.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {MANAGEMENT.managingDirector.credentials}.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {MANAGEMENT.managingDirector.industryRole}.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {MANAGEMENT.managingDirector.establishedNote}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {MANAGEMENT.managingDirector.amchamNote}
            </p>
          </li>
          <li className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
              {MANAGEMENT.deputyManagingDirector.role}
            </p>
            <h3 className="mt-3 font-heading text-2xl">
              {MANAGEMENT.deputyManagingDirector.name}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {MANAGEMENT.deputyManagingDirector.credentials}.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {MANAGEMENT.deputyManagingDirector.roleNote}
            </p>
          </li>
        </ul>
      </Section>

      <Section id="hire" className="scroll-mt-32 pt-0" reveal>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title="How we hire cars" />
            <p className="mt-5 max-w-prose text-base leading-relaxed text-muted-foreground">
              {COPY.howWeHire}
            </p>
            <p className="mt-4 text-sm">
              <Link href="/help" className="text-accent hover:underline">
                Full hire rules, documents, and cancellation
              </Link>
            </p>
          </div>
          <MarketingPhoto
            image={marketingImages.workshop}
            className="aspect-[16/10] rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {COPY.aboutFacts.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <h3 className="mt-10 font-heading text-xl">Core values</h3>
        <ul className="mt-4 grid gap-4 sm:grid-cols-3">
          {COPY.values.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <h3 className="font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="packages" className="scroll-mt-32 pt-0" reveal>
        <SectionHeading title="Hire packages" />
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Durations from the company papers, aligned with how this site books:
          self-drive online in 24-hour days; chauffeur, airport, and long-term
          quoted by staff in Ghana cedis.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {COPY.hirePackages.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <h3 className="font-heading text-xl">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="awards" className="scroll-mt-32 pt-0" reveal>
        <SectionHeading title="Awards" />
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {COPY.awardsNote}
        </p>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {AWARDS.map((item) => (
            <li
              key={`${item.year}-${item.name}`}
              className="flex h-full flex-col rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
                {item.year}
              </p>
              <p className="mt-3 font-heading text-xl">{item.name}</p>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {item.issuer}
                {"venue" in item && item.venue ? `, ${item.venue}` : ""}.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">{item.dateLabel}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="history" className="scroll-mt-32 pt-0" reveal>
        <SectionHeading title="From Sakaman to Plantsville" />
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {history.map((item) => (
            <li key={item.year} className="relative border-t-2 border-accent pt-4">
              <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">
                {item.year}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {COPY.plantsvilleOpeningThanks}
        </p>
      </Section>

      <Section id="group" className="scroll-mt-32 pt-0" reveal>
        <SectionHeading title="Nii Plants Group" />
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {COPY.group}
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {GROUP_OUTFITS.map((outfit) => (
            <li
              key={outfit.name}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <h3 className="font-heading text-xl">{outfit.name}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {outfit.detail}
              </p>
              {"href" in outfit && outfit.href ? (
                <a
                  href={outfit.href}
                  className="mt-3 inline-block text-sm text-accent hover:underline"
                  rel="noreferrer"
                  target="_blank"
                >
                  niiplantslogistics.com
                </a>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h3 className="font-heading text-xl">Mission</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {COPY.mission}
            </p>
          </article>
          <article className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h3 className="font-heading text-xl">Vision</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {COPY.vision}
            </p>
          </article>
        </div>
      </Section>

      <Section id="pickup" className="scroll-mt-32 pt-0" reveal>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <MarketingPhoto
            image={marketingImages.cabin}
            className="aspect-[16/10] rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div>
            <SectionHeading title="Pickup points" />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {COPY.desks}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {pickupPoints.map((point) => (
                <li
                  key={point.name}
                  className="rounded-xl bg-card px-4 py-3 ring-1 ring-border"
                >
                  <p className="font-medium">{point.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{point.detail}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">{COPY.hours}</p>
            <dl className="mt-6 space-y-2 text-sm">
              <div>
                <dt className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                  Legal name
                </dt>
                <dd className="mt-1">
                  {COMPANY.legalName}. Incorporated {COMPANY.incorporationStatute}
                  ; commenced {COMPANY.commencedDate}.
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                  Address
                </dt>
                <dd className="mt-1">
                  {COMPANY.streetAddress}, {COMPANY.addressLocality}, Accra.{" "}
                  {COMPANY.postalBox}.
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                  Call
                </dt>
                <dd className="mt-1">
                  <a
                    href={telHref(COMPANY.officeTelephoneDisplay)}
                    className="text-accent hover:underline"
                  >
                    {COMPANY.officeTelephoneDisplay}
                  </a>
                  {" · "}
                  <a
                    href={telHref(COMPANY.telephoneDisplay)}
                    className="text-accent hover:underline"
                  >
                    {COMPANY.telephoneDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
                  Email
                </dt>
                <dd className="mt-1">
                  <a
                    href={mailHref(COMPANY.email)}
                    className="text-accent hover:underline"
                  >
                    {COMPANY.email}
                  </a>
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm">
              <a
                href={COMPANY.mapsUrl}
                className="text-accent hover:underline"
                rel="noreferrer"
                target="_blank"
              >
                Open Plantsville in Google Maps
              </a>
              {" · "}
              <Link href="/contact" className="text-accent hover:underline">
                Contact form
              </Link>
            </p>
          </div>
        </div>
      </Section>

      <Section id="clientele" className="scroll-mt-32 pt-0" reveal>
        <ClienteleLogos />
      </Section>

      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="Ready to hire a car in Accra?"
          body="Check self-drive availability, or talk to the Plantsville desk about chauffeur and airport days."
        />
        <p className="mt-4 text-sm text-muted-foreground">
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
