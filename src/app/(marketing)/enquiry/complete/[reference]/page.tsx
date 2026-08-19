import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyValueButton } from "@/components/marketing/copy-value-button";
import { DeskPanel } from "@/components/marketing/desk-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageIntro, PageMasthead, Section } from "@/components/marketing/page-intro";
import { PageTrail } from "@/components/marketing/page-trail";
import { Button } from "@/components/ui/button";
import { getEnquiryByReference } from "@/lib/enquiries/queries";
import { enquiryServiceLabel } from "@/lib/enquiries/status";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";
import { marketingImages } from "@/lib/content/marketing-images";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import {
  mailHref,
  telHref,
  toPublicContact,
  whatsappHref,
} from "@/lib/settings/public-contact";

type PageProps = {
  params: Promise<{ reference: string }>;
};

export default async function EnquiryCompletePage({ params }: PageProps) {
  const { reference } = await params;
  const enquiry = await getEnquiryByReference(reference);
  if (!enquiry) {
    notFound();
  }

  const contact = toPublicContact(await getSiteSettings());

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Request received", path: `/enquiry/complete/${enquiry.reference}` },
        ])}
      />
      <Section className="pt-10">
        <PageMasthead
          trail={
            <PageTrail
              items={[
                { name: "Home", href: "/" },
                { name: "Request received" },
              ]}
            />
          }
          intro={
            <PageIntro
              eyebrow="Request received"
              title="We've received your request"
              lede="Our team will review your enquiry and contact you. This is not a confirmed booking."
            />
          }
          media={
            <MarketingPhoto
              image={marketingImages.keys}
              className="aspect-[16/10] rounded-2xl lg:aspect-[4/3]"
              sizes="(max-width: 1024px) 100vw, 28rem"
              objectPosition="center 18%"
            />
          }
        />
        <DeskPanel className="mt-8 max-w-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">
              <span className="text-muted-foreground">Reference:</span>{" "}
              <strong>{enquiry.reference}</strong>
            </p>
            <CopyValueButton value={enquiry.reference} label="Copy reference" />
          </div>
          <p className="mt-4 text-sm">
            <span className="text-muted-foreground">Service:</span>{" "}
            {enquiryServiceLabel(enquiry.serviceType)}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Thank you, {enquiry.firstName}. We typically respond during business hours.
          </p>
          <ol className="mt-6 space-y-3 border-l border-accent/40 pl-4 text-sm">
            <li>
              <p className="font-medium">Keep this reference</p>
              <p className="text-muted-foreground">
                Quote it if you call, WhatsApp, or email the desk.
              </p>
            </li>
            <li>
              <p className="font-medium">Staff review the request</p>
              <p className="text-muted-foreground">
                Monday–Saturday, 09:00–17:00 Accra time.
              </p>
            </li>
            <li>
              <p className="font-medium">We contact you</p>
              <p className="text-muted-foreground">
                Using the method you chose on the form. Nothing is booked until
                staff confirm.
              </p>
            </li>
          </ol>
          <div className="mt-6 flex flex-col gap-2 pt-2 sm:flex-row">
            {contact.phone ? (
              <Button asChild variant="outline" size="lg" className="h-11 px-4">
                <a href={telHref(contact.phone)}>Call us</a>
              </Button>
            ) : null}
            {contact.whatsapp ? (
              <Button asChild variant="outline" size="lg" className="h-11 px-4">
                <a href={whatsappHref(contact.whatsapp)}>WhatsApp</a>
              </Button>
            ) : null}
            {contact.email ? (
              <Button asChild variant="outline" size="lg" className="h-11 px-4">
                <a href={mailHref(contact.email)}>Email us</a>
              </Button>
            ) : null}
            <Button asChild size="lg" className="h-11 px-4">
              <Link href="/">Back to homepage</Link>
            </Button>
          </div>
        </DeskPanel>
      </Section>
    </main>
  );
}
