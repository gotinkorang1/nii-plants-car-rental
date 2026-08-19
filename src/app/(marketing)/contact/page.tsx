import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { ContactDesk } from "@/components/marketing/contact-desk";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingPhoto } from "@/components/marketing/marketing-photo";
import { PageBanner } from "@/components/marketing/page-banner";
import { Section, SectionHeading } from "@/components/marketing/page-intro";
import { OsmMapEmbed } from "@/components/maps/osm-map-embed";
import { COMPANY, PAGE_SEO } from "@/lib/content/company";
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
  const [settings, locations] = await Promise.all([
    getSiteSettings(),
    getPublicLocations(),
  ]);
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
        lede={`Call, WhatsApp, or email from ${COMPANY.openingHoursDisplay}. ${COMPANY.airportHoursNote}.`}
        breadcrumbs={[
          { name: "Home", href: "/" },
          { name: "Contact" },
        ]}
      />
      <Section className="pt-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            <ContactDesk contact={contact} />
            <p className="text-sm text-muted-foreground">{COMPANY.postalBox}</p>
            <p>
              <a
                className="text-primary hover:underline"
                href={COMPANY.mapsUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open Plantsville on OpenStreetMap
              </a>
            </p>
            {!hasDirect && !contact.address ? (
              <p className="rounded-2xl bg-card p-5 text-muted-foreground ring-1 ring-border">
                No public contact details are configured yet.
              </p>
            ) : null}
          </div>
          <div>
            <p className="mb-4 text-sm text-muted-foreground">
              We reply during Monday–Saturday hours. This form is a message, not a
              confirmed booking.
            </p>
            <EnquiryForm serviceType="general" submitLabel="Send message" />
          </div>
        </div>
      </Section>
      {mappedLocations.length > 0 ? (
        <Section className="pt-0 pb-20">
          <SectionHeading title="Pickup locations" />
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Maps use OpenStreetMap. Plantsville is shown at the Dansoman
            neighbourhood pin; the exact street is not in the public map data.
          </p>
          <MarketingPhoto
            image={marketingImages.arrival}
            className="mt-8 aspect-[16/8] rounded-2xl"
            sizes="(max-width: 1024px) 100vw, 72rem"
          />
          <ul className="mt-8 grid gap-6 lg:grid-cols-2">
            {mappedLocations.map((location) => (
              <li key={location.id}>
                <OsmMapEmbed
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
