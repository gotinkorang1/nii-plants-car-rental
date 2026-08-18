import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro, Section } from "@/components/marketing/page-intro";
import { PAGE_SEO } from "@/lib/content/company";
import { pageMetadata } from "@/lib/content/seo";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.requirements.title,
  description: PAGE_SEO.requirements.description,
  path: "/help/requirements",
});

export default async function RequirementsPage() {
  const settings = await getSiteSettings();

  return (
    <Section className="pt-10">
      <PageIntro
        eyebrow="Help"
        title="What you need to rent a car in Ghana"
        lede="Self-drive renters and extra drivers must be 25 or older, hold a full licence, and use the car inside Ghana only."
      />
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
            Free 48 hours or more before pickup. A fee applies inside 48 hours.
          </dd>
        </div>
      </dl>
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
  );
}
