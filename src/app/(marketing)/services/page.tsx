import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
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
    image: marketingImages.friends,
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
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Services" },
        ]}
      />
      <Section className="pt-10" reveal>
        <ul className="reveal-stagger grid gap-4 sm:grid-cols-2">
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
        <div className="mt-12">
          <h2 className="font-heading text-2xl">Multi-city or custom transport</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Describe routes across Ghana or a bespoke itinerary. {COPY.customTransport}
          </p>
          <div className="mt-6">
            <EnquiryForm serviceType="multi_city" submitLabel="Request custom transport" />
          </div>
        </div>
      </Section>
    </main>
  );
}
