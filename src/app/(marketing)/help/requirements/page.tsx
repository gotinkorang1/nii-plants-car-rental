import type { Metadata } from "next";

import { CtaPanel } from "@/components/marketing/cta-panel";
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
    <main>
      <PageBanner
        image={marketingImages.keys}
        eyebrow="Help"
        title="What you need to rent a car in Ghana"
        lede={COPY.requirementsIntro}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Help", href: "/help" },
          { name: "Requirements" },
        ]}
      />
      <Section className="pt-10" reveal>
        <SectionHeading title="Bring these to pickup" />
        <ol className="reveal-stagger mt-6 grid gap-3 sm:grid-cols-2">
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
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:col-span-2 lg:col-span-1">
            <dt className="text-sm text-muted-foreground">Use</dt>
            <dd className="mt-1 font-medium">Inside Ghana only. No land-border crossing.</dd>
          </div>
        </dl>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          <li className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h3 className="font-medium">Cancellation</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {COPY.cancellation}
            </p>
          </li>
          <li className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h3 className="font-medium">Insurance</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {COPY.insurance}
            </p>
          </li>
          <li className="rounded-2xl bg-card p-5 ring-1 ring-border">
            <h3 className="font-medium">Mileage and hours</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {COPY.mileage} {COPY.hours}
            </p>
          </li>
        </ul>
      </Section>
      <Section className="pt-0 pb-20" reveal>
        <CtaPanel
          title="Ready to check a car?"
          body="Browse published models, or read the FAQs on booking, Kotoka, and extra drivers."
          primaryHref="/fleet"
          primaryLabel="View the fleet"
          secondaryHref="/help/faqs"
          secondaryLabel="Read FAQs"
        />
      </Section>
    </main>
  );
}
