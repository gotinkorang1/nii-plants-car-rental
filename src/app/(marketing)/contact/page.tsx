import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageIntro, Section } from "@/components/marketing/page-intro";
import { COMPANY, PAGE_SEO } from "@/lib/content/company";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import {
  mailHref,
  telHref,
  toPublicContact,
  whatsappHref,
} from "@/lib/settings/public-contact";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.contact.title,
  description: PAGE_SEO.contact.description,
  path: "/contact",
});

export default async function ContactPage() {
  const contact = toPublicContact(await getSiteSettings());
  const hasDirect =
    Boolean(contact.phone) || Boolean(contact.whatsapp) || Boolean(contact.email);

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <Section className="pt-10">
        <PageIntro
          eyebrow="Contact"
          title="Contact Nii Plants in Accra"
          lede={`Call, WhatsApp, or email from ${COMPANY.openingHoursDisplay}. ${COMPANY.airportHoursNote}.`}
        />
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-3 text-sm">
            {contact.phone ? (
              <p>
                <a className="text-primary hover:underline" href={telHref(contact.phone)}>
                  Call centre {contact.phone}
                </a>
              </p>
            ) : null}
            <p>
              <a
                className="text-primary hover:underline"
                href={telHref(COMPANY.officeTelephoneDisplay)}
              >
                Office {COMPANY.officeTelephoneDisplay}
              </a>
            </p>
            {contact.whatsapp ? (
              <p>
                <a
                  className="text-primary hover:underline"
                  href={whatsappHref(contact.whatsapp)}
                >
                  WhatsApp
                </a>
              </p>
            ) : null}
            {contact.email ? (
              <p>
                <a className="text-primary hover:underline" href={mailHref(contact.email)}>
                  {contact.email}
                </a>
              </p>
            ) : null}
            {contact.address ? (
              <p className="text-muted-foreground">{contact.address}</p>
            ) : null}
            <p className="text-muted-foreground">{COMPANY.postalBox}</p>
            <p>
              <a
                className="text-primary hover:underline"
                href={COMPANY.mapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Plantsville on Google Maps
              </a>
            </p>
            {!hasDirect && !contact.address ? (
              <p className="rounded-2xl bg-card p-5 text-muted-foreground ring-1 ring-border">
                No public contact details are configured yet.
              </p>
            ) : null}
          </div>
          <EnquiryForm serviceType="general" submitLabel="Send message" />
        </div>
      </Section>
    </main>
  );
}
