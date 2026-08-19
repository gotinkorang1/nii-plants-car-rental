import type { Metadata } from "next";
import Link from "next/link";

import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { PAGE_SEO } from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { marketingImages } from "@/lib/content/marketing-images";
import { pageMetadata } from "@/lib/content/seo";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.requirements.title,
  description: PAGE_SEO.requirements.description,
  path: "/help/requirements",
});

const pickupChecklist = COPY.pickupChecklist;

export default async function RequirementsPage() {
  const settings = await getSiteSettings();

  return (
    <>
    <PageBanner
      image={marketingImages.keys}
      eyebrow="Help"
      title="What you need to rent a car in Ghana"
        lede={COPY.requirementsIntro}
      breadcrumbs={[
        { name: "Home", href: "/" },
        { name: "Help", href: "/help" },
        { name: "Requirements" },
      ]}
      compact
    />
    <Section className="pt-10" reveal>
      <SectionHeading title="Bring these to pickup" />
      <ol className="reveal-stagger mt-4 grid gap-3 sm:grid-cols-2">
        {pickupChecklist.map((item, index) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border"
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
              {index + 1}
            </span>
            <span className="text-sm font-medium">{item}</span>
          </li>
        ))}
      </ol>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <dt className="text-sm text-muted-foreground">Minimum age</dt>
          <dd className="mt-1 font-medium">25 years, with a full driving licence</dd>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <dt className="text-sm text-muted-foreground">Minimum hire</dt>
          <dd className="mt-1 font-medium">{settings.minimumRentalHours} hours</dd>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <dt className="text-sm text-muted-foreground">Reservation payment</dt>
          <dd className="mt-1 font-medium">
            {settings.reservationPaymentPercent}% of the rental total
          </dd>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <dt className="text-sm text-muted-foreground">Security deposit</dt>
          <dd className="mt-1 font-medium">
            Refundable at pickup. The amount depends on the vehicle class.
          </dd>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <dt className="text-sm text-muted-foreground">Documents</dt>
          <dd className="mt-1 font-medium">
            Full licence plus Ghana Card or passport for every named driver
          </dd>
        </div>
        <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
          <dt className="text-sm text-muted-foreground">Cancellation</dt>
          <dd className="mt-1 font-medium">
            {COPY.cancellation}
          </dd>
        </div>
      </dl>
      <p className="mt-6 max-w-3xl text-sm text-muted-foreground">{COPY.insurance}</p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{COPY.mileage}</p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{COPY.hours}</p>
      <p className="mt-6 text-sm">
        <Link href="/help/faqs" className="text-primary hover:underline">
          Read FAQs
        </Link>
        {" · "}
        <Link href="/fleet" className="text-primary hover:underline">
          Back to fleet
        </Link>
      </p>
    </Section>
    </>
  );
}
