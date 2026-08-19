import type { Metadata } from "next";
import Link from "next/link";

import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageIntro, Section } from "@/components/marketing/page-intro";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";

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
      <Section className="pt-10">
        <PageIntro
          eyebrow="Help"
          title="Car rental help for Ghana hire"
          lede="Licence rules, payments, Kotoka pickup, and cancellation for self-drive and chauffeur hire with Nii Plants."
        />
        <MarketingPhoto
          image={marketingImages.phone}
          className="mt-8 aspect-[16/8] max-w-3xl rounded-2xl"
          sizes="(max-width: 768px) 100vw, 48rem"
          priority
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {topics.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="block h-full rounded-2xl bg-card p-5 ring-1 ring-border hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h2 className="font-medium">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
