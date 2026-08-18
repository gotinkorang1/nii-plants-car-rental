import type { Metadata } from "next";
import Link from "next/link";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageIntro, Section } from "@/components/marketing/page-intro";
import { Button } from "@/components/ui/button";
import { PAGE_SEO } from "@/lib/content/company";
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
      <Section className="pt-10">
        <PageIntro
          eyebrow="Corporate"
          title="Corporate car rental for Accra teams and visitors"
          lede="Nii Plants has hired cars to organisations in Ghana since 2007. GTA award-winning Accra hire, Kotoka meet-and-greet, and hotel desks at Alisa North Ridge and in Takoradi. Quoted by the operations team."
        />
        <div className="mt-8">
          <Button asChild variant="outline">
            <Link href="/services/self-drive">Self-drive for staff trips</Link>
          </Button>
        </div>
      </Section>
      <Section className="pt-0">
        <div className="grid gap-8 lg:grid-cols-2">
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {items.map((item) => (
              <li key={item.title} className="rounded-2xl bg-card p-5 ring-1 ring-border">
                <h2 className="font-medium">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
          <EnquiryForm serviceType="corporate" submitLabel="Request corporate mobility" />
        </div>
      </Section>
    </main>
  );
}
