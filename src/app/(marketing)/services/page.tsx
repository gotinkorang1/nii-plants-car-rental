import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { PageIntro, Section } from "@/components/marketing/page-intro";
import { PAGE_SEO } from "@/lib/content/company";
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
    body: "Drive yourself in Accra and across Ghana. 24-hour days, model or similar.",
  },
  {
    href: "/services/chauffeur",
    title: "Chauffeur service",
    body: "A driven sedan, SUV or 4x4. Daily hire is a 10-hour duty day.",
  },
  {
    href: "/services/airport-transfer",
    title: "Kotoka airport transfer",
    body: "Pickup and drop-off at Kotoka International Airport, including evenings.",
  },
  {
    href: "/services/long-term",
    title: "Long-term car rental",
    body: "Weekly, monthly, and multi-month hire, quoted by staff in Ghana cedis.",
  },
  {
    href: "/services/events",
    title: "Weddings and groups",
    body: "Hiace vans and a 30-seater Coaster for weddings, conferences, and tours.",
  },
  {
    href: "/corporate",
    title: "Corporate mobility",
    body: "Staff travel, visiting employees, and client cars from Dansoman, Accra.",
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
      <Section className="pt-10">
        <PageIntro
          eyebrow="Services"
          title="Car hire services in Ghana"
          lede="Self-drive bookings start online. Chauffeur, airport, long-term, wedding, and corporate trips are arranged with the Accra operations team."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block h-full rounded-2xl bg-card p-6 ring-1 ring-border hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h2 className="font-heading text-2xl">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-12 rounded-2xl bg-card p-6 ring-1 ring-border">
          <h2 className="font-heading text-2xl">Multi-city or custom transport</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Describe routes across Ghana or a bespoke itinerary. Staff review every
            custom request manually.
          </p>
          <div className="mt-6">
            <EnquiryForm serviceType="multi_city" submitLabel="Request custom transport" />
          </div>
        </div>
      </Section>
    </main>
  );
}
