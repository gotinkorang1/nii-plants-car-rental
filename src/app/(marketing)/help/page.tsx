import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section } from "@/components/marketing/page-intro";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.help.title,
  description: PAGE_SEO.help.description,
  path: "/help",
});

const topics = [
  {
    href: "/help/requirements",
    title: "Rental requirements",
    body: "Age 25+, full licence, Ghana Card or passport, and the refundable deposit.",
  },
  {
    href: "/help/faqs#faq-booking",
    title: "Booking",
    body: "Start a self-drive request with dates and an Accra pickup location.",
  },
  {
    href: "/help/faqs#faq-payments",
    title: "Payments",
    body: "Reservation payment, balance before pickup, and what the Ghana cedi quote includes.",
  },
  {
    href: "/help/faqs#faq-vehicle-pickup",
    title: "Vehicle pickup",
    body: "Dansoman office hours, Kotoka collections, and documents at handover.",
  },
  {
    href: "/help/faqs#faq-vehicle-return",
    title: "Vehicle return",
    body: "Where to return the car and how to ask for an extension.",
  },
  {
    href: "/help/faqs#faq-cancellations",
    title: "Cancellations",
    body: "Free cancellation 48 hours or more before pickup.",
  },
  {
    href: "/contact",
    title: "Support",
    body: "Call, WhatsApp, or email the Plantsville team in Dansoman.",
  },
] as const;

export default function HelpPage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Help", path: "/help" },
        ])}
      />
      <PageBanner
        image={marketingImages.phone}
        eyebrow="Help"
        title="Car rental help for Ghana hire"
        lede="Licence rules, payments, Kotoka pickup, and cancellation for self-drive and chauffeur hire with Nii Plants."
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Help" },
        ]}
        compact
      />
      <Section className="pt-10">
        <ul className="grid gap-4 sm:grid-cols-2">
          {topics.map((item) => (
            <li key={item.title}>
              <Link href={item.href} className="group block h-full focus-visible:outline-none">
                <Card className="h-full gap-0 overflow-hidden rounded-2xl py-0 text-base shadow-none ring-border transition-[transform,box-shadow] duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_30px_rgba(24,26,24,0.08)] group-focus-visible:ring-2 group-focus-visible:ring-ring motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
                  <span className="block h-0.5 bg-accent" aria-hidden />
                  <CardHeader className="p-5 pb-0">
                    <h2 className="font-heading text-base leading-snug font-medium group-hover:text-primary">
                      {item.title}
                    </h2>
                    <CardDescription className="text-sm">{item.body}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-4 text-sm font-medium text-primary">
                    Open
                    <span aria-hidden className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-0.5">
                      →
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
