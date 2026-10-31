import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { ContactDesk } from "@/components/marketing/contact-desk";
import { JsonLd } from "@/components/marketing/json-ld";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { GoogleMapEmbed } from "@/components/maps/google-map-embed";
import { COMPANY, PAGE_SEO } from "@/lib/content/company";
import { COPY } from "@/lib/content/copy";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublicLocations } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import { breadcrumbJsonLd } from "@/lib/content/structured-data";
import { getSiteSettings } from "@/lib/settings/get-site-settings";
import { toPublicContact } from "@/lib/settings/public-contact";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.contact.title,
  description: PAGE_SEO.contact.description,
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const locations = await getPublicLocations();
  const contact = toPublicContact(settings);
  const hasDirect =
    Boolean(contact.phone) || Boolean(contact.whatsapp) || Boolean(contact.email);
  const mappedLocations = locations.filter(
    (location): location is typeof location & { latitude: number; longitude: number } =>
      typeof location.latitude === "number" &&
      typeof location.longitude === "number",
  );

  return (
    <main>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />
      <PageBanner
        image={marketingImages.valet}
        eyebrow="Contact"
        title="Contact Nii Plants in Accra"
        lede={COPY.contactLede}
        compact
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Contact" },
        ]}
      />
      <Section className={mappedLocations.length > 0 ? "pt-10" : "pt-10 pb-20"} reveal>
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <SectionHeading title="Plantsville desk" />
            <div className="mt-6 space-y-5">
              <ContactDesk contact={contact} />
              <p className="text-sm text-muted-foreground">{COMPANY.postalBox}</p>
              <p className="text-sm">
                <a
                  className="text-accent hover:underline"
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
          </div>
          <div>
            <SectionHeading title="Send a message" />
            <p className="mt-4 mb-6 text-sm leading-relaxed text-muted-foreground">
              We reply during Monday–Saturday office hours. This form is a
              message, not a confirmed booking.
            </p>
            <EnquiryForm serviceType="general" submitLabel="Send message" />
          </div>
        </div>
      </Section>
      {mappedLocations.length > 0 ? (
        <Section className="pt-0 pb-20" reveal>
          <SectionHeading title="Pickup locations" />
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Maps use Google Maps. {COPY.mapsNote}
          </p>
          <ul className="mt-8 grid gap-6 lg:grid-cols-2">
            {mappedLocations.map((location) => (
              <li key={location.id}>
                <GoogleMapEmbed
                  name={location.name}
                  type={location.type}
                  latitude={location.latitude}
                  longitude={location.longitude}
                />
                {location.address ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {location.address}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </main>
  );
}
