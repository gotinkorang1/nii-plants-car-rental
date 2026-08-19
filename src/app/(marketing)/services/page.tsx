import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { CtaPanel } from "@/components/marketing/cta-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { ServiceCard } from "@/components/marketing/service-card";
import { PAGE_SEO } from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.services.title,
  description: PAGE_SEO.services.description,
  path: "/services",
});

const items = [
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
    title: "Kotoka airport transfer",
    body: COPY.services.airport,
    image: marketingImages.airport,
  },
  {
    href: "/services/long-term",
    title: "Long-term car rental",
    body: COPY.services.longTerm,
    image: marketingImages.longTerm,
  },
  {
    href: "/services/events",
    title: "Weddings and groups",
    body: COPY.services.events,
    image: marketingImages.events,
  },
  {
    href: "/corporate",
    title: "Corporate mobility",
    body: COPY.services.corporate,
    image: marketingImages.corporate,
  },
] as const;

export default function ServicesPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />
      <PageBanner
        image={marketingImages.chauffeur}
        eyebrow="Services"
        title="Car hire services in Ghana"
        lede={COPY.servicesIntro}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Services" },
        ]}
      />
      <Section className="pt-10" reveal>
        <SectionHeading title="Choose a hire type" />
        <ul className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.href}>
              <ServiceCard
                href={item.href}
                title={item.title}
                body={item.body}
                image={item.image}
              />
            </li>
          ))}
        </ul>
      </Section>
      <Section className="pt-0" reveal>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <SectionHeading title="Multi-city or custom transport" />
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
              {COPY.customTransport}
            </p>
          </div>
          <EnquiryForm serviceType="multi_city" submitLabel="Request custom transport" />
        </div>
      </Section>
      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="Or book self-drive online"
          body="Published models are available to check now. Chauffeur and airport days stay on enquiry."
          primaryHref="/book"
          primaryLabel="Book a Vehicle"
          secondaryHref="/fleet"
          secondaryLabel="Browse fleet"
        />
      </Section>
    </main>
  );
}
