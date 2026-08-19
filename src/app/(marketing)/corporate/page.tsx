import type { Metadata } from "next";
import Link from "next/link";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { ClienteleLogos } from "@/components/marketing/clientele-logos";
import { CtaPanel } from "@/components/marketing/cta-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.corporate.title,
  description: PAGE_SEO.corporate.description,
  path: "/corporate",
});

const items = [
  {
    title: "Company travel",
    body: "Staff movement around Accra using published saloons, SUVs and 4x4s.",
  },
  {
    title: "Executive transport",
    body: "Chauffeur requests for meetings, ministries, and airport days.",
  },
  {
    title: "Long-term fleet needs",
    body: "Cover for projects or secondments, quoted weekly or monthly.",
  },
  {
    title: "Airport movement",
    body: "Kotoka meet-and-greet for visiting employees and clients.",
  },
  {
    title: "Event transport",
    body: "Guest logistics for conferences and company occasions.",
  },
  {
    title: "Hotel desks",
    body: "Pickup at Alisa Hotel North Ridge in Accra and Best Western Plus Atlantic Hotel in Takoradi, as well as Plantsville.",
  },
] as const;

export default function CorporatePage() {
  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Corporate", path: "/corporate" },
        ])}
      />
      <PageBanner
        image={marketingImages.executiveSuv}
        eyebrow="Corporate"
        title="Corporate car rental for Accra teams and visitors"
        lede="Nii Plants has hired cars to organisations in Ghana since 2007. GTA award-winning Accra hire, Kotoka meet-and-greet, and hotel desks at Alisa North Ridge and in Takoradi. Quoted by the operations team in Ghana cedis."
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Corporate" },
        ]}
      >
        <Button
          asChild
          variant="outline"
          className="h-11 border-white/40 bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white"
        >
          <Link href="/services/self-drive">Self-drive for staff trips</Link>
        </Button>
      </PageBanner>
      <Section className="pt-10" reveal>
        <SectionHeading title="What we quote" />
        <ul className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.title}
              className="rounded-2xl bg-card p-5 ring-1 ring-border"
            >
              <h2 className="font-heading text-xl">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>
      <Section className="pt-0" reveal>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <SectionHeading title="Request a quote" />
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted-foreground">
              There is no automated corporate price list. Staff reply with a Ghana
              cedi quote for the days and class you need.
            </p>
            <MarketingPhoto
              image={marketingImages.corporate}
              className="mt-6 aspect-[16/10] rounded-2xl"
              sizes="(max-width: 1024px) 100vw, 45vw"
            />
          </div>
          <EnquiryForm serviceType="corporate" submitLabel="Request corporate mobility" />
        </div>
      </Section>
      <Section className="pt-0" reveal>
        <ClienteleLogos heading="Clientele" />
      </Section>
      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="Need a self-drive car for staff?"
          body="Published models can be checked online. Chauffeur and airport days stay with the operations team."
          primaryHref="/book"
          primaryLabel="Book a Vehicle"
          secondaryHref="/contact"
          secondaryLabel="Contact"
        />
      </Section>
    </main>
  );
}
