import type { Metadata } from "next";
import Link from "next/link";

import { BookingSearchWidget } from "@/components/marketing/booking-search-widget";
import { CtaPanel } from "@/components/marketing/cta-panel";
import { FaqList } from "@/components/marketing/faq-list";
import { HowHireWorks } from "@/components/marketing/how-hire-works";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { ServiceCard } from "@/components/marketing/service-card";
import { TrustMarks } from "@/components/marketing/trust-marks";
import { Button } from "@/components/ui/button";
import { FeaturedModels } from "@/components/fleet/featured-models";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublishedFaqs, getPublicLocations } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import {
  autoRentalJsonLd,
  faqPageJsonLd,
} from "@/lib/content/structured-data";
import { getFeaturedModels } from "@/lib/fleet/get-featured-models";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { toPublicContact } from "@/lib/settings/public-contact";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    path: "/",
    absolute: true,
  });
}

const services = [
  {
    href: "/services/self-drive",
    title: "Self-drive car rental",
    body: "Drive yourself from Accra for 24-hour days. Book a published model or similar.",
    image: marketingImages.selfDrive,
  },
  {
    href: "/services/chauffeur",
    title: "Chauffeur service",
    body: "A professional driver for meetings, visitors, and intercity trips. 10-hour duty day.",
    image: marketingImages.chauffeur,
  },
  {
    href: "/services/airport-transfer",
    title: "Kotoka airport pickup",
    body: "Meet-and-greet at Kotoka International Airport, including evenings until 23:00.",
    image: marketingImages.airport,
  },
  {
    href: "/corporate",
    title: "Corporate mobility",
    body: "Staff travel, visiting employees, and longer assignments quoted by our Accra team.",
    image: marketingImages.corporate,
  },
  {
    href: "/services/long-term",
    title: "Long-term hire",
    body: "Weekly, monthly, and multi-month cars for work in Accra or travel around Ghana.",
    image: marketingImages.longTerm,
  },
  {
    href: "/services/events",
    title: "Weddings and groups",
    body: "Hiace vans and a 30-seater Coaster for weddings, conferences, and group travel.",
    image: marketingImages.events,
  },
] as const;

export default async function HomePage() {
  const [settings, locations, featured, faqs] = await Promise.all([
    getSiteSettings(),
    getPublicLocations(),
    getFeaturedModels(3).catch(() => []),
    getPublishedFaqs(),
  ]);
  const contact = toPublicContact(settings);
  const previewFaqs = faqs.slice(0, 4);
  const faqSchema = faqPageJsonLd(previewFaqs);

  return (
    <main>
      <JsonLd
        data={autoRentalJsonLd({
          telephone: contact.phone || undefined,
          email: contact.email || undefined,
          description: PAGE_SEO.home.description,
        })}
      />
      {faqSchema ? <JsonLd data={faqSchema} /> : null}
      <section className="relative isolate -mt-16 overflow-hidden">
        <MarketingPhoto
          image={marketingImages.keys}
          className="absolute inset-0 h-full min-h-[32rem]"
          sizes="100vw"
          objectPosition="center 20%"
          priority
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(24,26,24,0.78)_0%,rgba(24,26,24,0.48)_48%,rgba(24,26,24,0.22)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#181a18]/70 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
          <div className="max-w-2xl space-y-5">
            <p className="flex items-center gap-2.5 text-sm font-medium tracking-[0.16em] text-accent uppercase">
              <span className="h-px w-6 bg-accent" aria-hidden />
              Car rental in Accra since 2007
            </p>
            <h1 className="font-heading text-4xl tracking-tight text-white sm:text-6xl">
              {contact.homepageHeadline ||
                "Rent a car in Accra — self-drive or chauffeur"}
            </h1>
            <p className="max-w-xl text-base text-white/85 sm:text-lg">
              {contact.homepageSubheadline || PAGE_SEO.home.description}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href="/book">Book a Vehicle</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-11 px-5 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link href="/fleet">View the fleet</Link>
              </Button>
            </div>
          </div>
          <div className="mt-10">
            <BookingSearchWidget locations={locations} />
          </div>
        </div>
      </section>

      <Section className="py-10" reveal>
        <TrustMarks />
      </Section>

      <Section className="pt-0" reveal>
        {featured.length > 0 ? (
          <FeaturedModels models={featured} title="Cars to hire in Accra" />
        ) : (
          <div className="rounded-2xl bg-card p-6 ring-1 ring-border">
            <h2 className="font-heading text-2xl">Cars to hire in Accra</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse saloons, SUVs, 4x4s and coaches when the catalogue is published.
            </p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/fleet">Open fleet</Link>
            </Button>
          </div>
        )}
      </Section>

      <Section className="pt-0" reveal>
        <HowHireWorks />
      </Section>

      <Section className="pt-0" reveal>
        <SectionHeading title="Car hire services in Ghana" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((item) => (
            <li key={item.href}>
              <ServiceCard
                href={item.href}
                title={item.title}
                body={item.body}
                image={item.image}
                headingLevel="h3"
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section className="pt-0" reveal>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <MarketingPhoto
              image={marketingImages.workshop}
              className="mb-5 aspect-[16/10] rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <h2 className="font-heading text-2xl">
              <span className="mb-3 block h-0.5 w-8 bg-accent" aria-hidden />
              Why hire from Nii Plants
            </h2>
            <p className="mt-3 text-muted-foreground">
              You book a model or similar, not a registration plate. Staff assign
              a roadworthy car, confirm the Ghana cedi rate before you pay, and
              keep mileage included for ordinary use inside Ghana. The Ghana
              Tourism Authority has twice named the company in its car-rental
              awards, in 2022 and 2024.
            </p>
          </div>
          <div>
            <MarketingPhoto
              image={marketingImages.airport}
              className="mb-5 aspect-[16/10] rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <h2 className="font-heading text-2xl">
              <span className="mb-3 block h-0.5 w-8 bg-accent" aria-hidden />
              Airport arrivals at Kotoka
            </h2>
            <p className="mt-3 text-muted-foreground">
              Share your flight details when you book. We can meet you after
              landing, or you can collect a self-drive car. Evening collections
              run until 23:00 by arrangement.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/services/airport-transfer">Airport transfers</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section className="pt-0" reveal>
        <div className="relative overflow-hidden rounded-2xl">
          <MarketingPhoto
            image={marketingImages.executiveBanner}
            className="aspect-[21/8] min-h-64"
            sizes="(max-width: 1024px) 100vw, 72rem"
          />
          <div className="absolute inset-0 bg-primary/72" />
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-accent" />
          <div className="absolute inset-0 flex flex-col justify-end px-6 py-10 text-primary-foreground sm:px-10">
            <h2 className="font-heading text-3xl">Corporate car rental in Accra</h2>
            <p className="mt-3 max-w-2xl text-primary-foreground/85">
              Company travel, visiting staff, and longer assignments are quoted by
              the Plantsville operations team — including chauffeur cars and
              airport meet-and-greet.
            </p>
            <Button asChild variant="secondary" className="mt-6 h-11 w-fit px-4">
              <Link href="/corporate">Request corporate mobility</Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section className="pt-0" reveal>
        <MarketingPhoto
          image={marketingImages.friends}
          className="mb-6 aspect-[21/9] rounded-2xl"
          sizes="(max-width: 1024px) 100vw, 72rem"
        />
        <h2 className="font-heading text-2xl">
          <span className="mb-3 block h-0.5 w-8 bg-accent" aria-hidden />
          Travel around Ghana
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Use the fleet for Accra days, Cape Coast or Kumasi road trips, and
          Takoradi pickup. Hire stays inside Ghana. Land-border crossing is not
          permitted.
        </p>
      </Section>

      <Section className="pt-0" reveal>
        <SectionHeading
          title="Car rental questions"
          action={
            <Link href="/help/faqs" className="text-sm text-primary hover:underline">
              All FAQs
            </Link>
          }
        />
        <div className="mt-6">
          <FaqList items={previewFaqs} />
        </div>
      </Section>

      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="Ready to hire a car?"
          body="Check Accra availability or browse published models."
        />
      </Section>
    </main>
  );
}
