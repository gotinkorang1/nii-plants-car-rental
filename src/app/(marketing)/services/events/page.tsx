import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { ServicePage } from "@/components/marketing/service-page";
import { PAGE_SEO } from "@/lib/content/company";
import { getPublishedFaqs } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import { listActiveVehicleClassOptions } from "@/lib/enquiries/queries";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.events.title,
  description: PAGE_SEO.events.description,
  path: "/services/events",
});

export default async function EventsPage() {
  const [faqs, vehicleClasses] = await Promise.all([
    getPublishedFaqs("Support"),
    listActiveVehicleClassOptions(),
  ]);

  return (
    <ServicePage
      eyebrow="Events"
      title="Wedding and group car hire in Accra"
      lede="Cars, Hiace vans and a 30-seater Coaster for weddings, conferences, church programmes, and tours. Event transport is chauffeur-led and quoted by staff."
      benefits={[
        {
          title: "Weddings",
          body: "Timed cars for the couple, family, and guests. Quoted after you share the day's places.",
        },
        {
          title: "Conferences",
          body: "Guest shuttles and airport runs coordinated with the operations team.",
        },
        {
          title: "Coaster and vans",
          body: "The 30-seater Coaster and Hiace are arranged with a driver, not as online self-drive.",
        },
        {
          title: "Special occasions",
          body: "Describe the occasion, passenger counts, and luggage. Staff will say what is possible.",
        },
      ]}
      steps={[
        { title: "Share the occasion", body: "Date, places, and passenger counts." },
        { title: "Review classes", body: "Use the fleet pages as a visual guide to saloons, SUVs and coaches." },
        { title: "Confirm with staff", body: "A person replies with a Ghana cedi quote. There is no event checkout here." },
      ]}
      faqs={faqs}
      form={
        <EnquiryForm
          serviceType="events"
          vehicleClasses={vehicleClasses}
          submitLabel="Enquire about event transport"
        />
      }
    />
  );
}
