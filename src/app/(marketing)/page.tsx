import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Building2, Plane } from "lucide-react";

import { BookingSearchWidget } from "@/components/marketing/booking-search-widget";
import { ClienteleLogos } from "@/components/marketing/clientele-logos";
import { CtaPanel } from "@/components/marketing/cta-panel";
import { FaqList } from "@/components/marketing/faq-list";
import { HowHireWorks } from "@/components/marketing/how-hire-works";
import { JsonLd } from "@/components/marketing/json-ld";
import { HeroCarousel } from "@/components/marketing/hero-carousel";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { ServiceCard } from "@/components/marketing/service-card";
import { Button } from "@/components/ui/button";
import { FeaturedModels } from "@/components/fleet/featured-models";
import { PAGE_SEO } from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublishedFaqs, getPublicLocations } from "@/lib/content/queries";
import { listPublishedStories } from "@/lib/content/published-stories";
import { pageMetadata } from "@/lib/content/seo";
import {
  autoRentalJsonLd,
  faqPageJsonLd,
} from "@/lib/content/structured-data";
import { getFeaturedModels } from "@/lib/fleet/get-featured-models";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { toPublicContact } from "@/lib/settings/public-contact";

const getCachedHomeData = unstable_cache(
  async () =>
    Promise.all([
      getSiteSettings(),
      getPublicLocations(),
      getFeaturedModels(3).catch(() => []),
      getPublishedFaqs(),
      listPublishedStories(),
    ]),
  ["public-home-data"],
  { revalidate: 300, tags: ["public-home"] },
);

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    path: "/",
    absolute: true,
    keywords: [
      "car rental Accra",
      "self-drive Ghana",
      "chauffeur Accra",
      "Kotoka airport car hire",
      "Nii Plants",
    ],
  });
}

const services = [
  {
    href: "/services/self-drive",
    title: "Self-drive car rental",
    body: COPY.services.selfDrive,
    image: marketingImages.selfDrive,
  },
  {
    href: "/services/chauffeur",
    title: "Chauffeur service",
    body: COPY.services.chauffeur,
    image: marketingImages.chauffeur,
  },
  {
    href: "/services/airport-transfer",
    title: "Kotoka airport pickup",
    body: COPY.services.airport,
    image: marketingImages.airport,
  },
  {
    href: "/corporate",
    title: "Corporate mobility",
    body: COPY.services.corporate,
    image: marketingImages.corporate,
  },
  {
    href: "/services/long-term",
    title: "Long-term hire",
    body: COPY.services.longTerm,
    image: marketingImages.longTerm,
  },
  {
    href: "/services/events",
    title: "Weddings and groups",
    body: COPY.services.events,
    image: marketingImages.events,
  },
] as const;

export default async function HomePage() {
  const [settings, locations, featured, faqs, stories] = await getCachedHomeData();
  const contact = toPublicContact(settings);
  const previewFaqs = faqs.slice(0, 4);
  const faqSchema = faqPageJsonLd(previewFaqs);
  const previewStories = stories.slice(0, 3);

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
      <HeroCarousel
        headline={contact.homepageHeadline || undefined}
        subheadline={contact.homepageSubheadline || undefined}
      />

      <Section className="py-10" reveal>
        <BookingSearchWidget locations={locations} />
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
        <ul className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              {COPY.whyHire}
            </p>
            <p className="mt-3 text-muted-foreground">
              {COPY.ghanaTravel}
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
              {COPY.airportHome}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/services/airport-transfer">
                <Plane className="size-4" />
                Airport transfers
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      <Section className="pt-0" reveal>
        <div className="relative overflow-hidden rounded-2xl">
          <MarketingPhoto
            image={marketingImages.executiveBanner}
            className="min-h-72 aspect-[16/9] sm:aspect-[21/8] sm:min-h-64"
            sizes="(max-width: 1024px) 100vw, 72rem"
          />
          <div className="absolute inset-0 bg-primary/72" />
          <div className="absolute inset-x-0 top-0 z-10 h-0.5 bg-accent" />
          <div className="absolute inset-0 flex flex-col justify-end px-5 py-8 text-primary-foreground sm:px-10 sm:py-10">
            <h2 className="font-heading text-2xl sm:text-3xl">Corporate car rental in Accra</h2>
            <p className="mt-3 max-w-2xl text-sm text-primary-foreground/85 sm:text-base">
              {COPY.corporateHome}
            </p>
            <Button asChild variant="secondary" className="mt-6 h-11 w-fit px-4">
              <Link href="/corporate">
                <Building2 className="size-4" />
                Request corporate mobility
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {previewStories.length > 0 ? (
      <Section className="pt-0" reveal>
        <SectionHeading
          title="News from Accra"
          action={
            <Link href="/news" className="text-sm font-medium text-accent hover:underline">
              All news
            </Link>
          }
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {previewStories.map((article) => (
            <li key={article.slug}>
              <Link
                href={`/news/${article.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border"
              >
                <MarketingPhoto
                  image={article.image}
                  className="aspect-[16/9]"
                  sizes="(max-width: 640px) 100vw, 33vw"
                  zoomOnHover
                />
                <span className="p-4">
                  <span className="block text-xs font-medium tracking-[0.16em] text-accent uppercase">
                    {article.dateLabel}
                  </span>
                  <span className="mt-2 block font-heading text-lg group-hover:text-accent">
                    {article.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
      ) : null}

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

      <Section className="pt-0" reveal>
        <ClienteleLogos />
      </Section>

      <Section className="pt-0" reveal>
        <SectionHeading title="What travellers say" />
        <ul className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-3">
          {COPY.testimonials.map((item) => (
            <li
              key={item.name}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">
                {item.title}
              </p>
              <blockquote className="mt-3 text-sm text-muted-foreground">
                “{item.quote}”
              </blockquote>
              <p className="mt-4 text-sm font-medium">
                {item.name}
                {"place" in item && item.place ? `, ${item.place}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title={COPY.ctaTitle}
          body={COPY.ctaBody}
        />
      </Section>
    </main>
  );
}
