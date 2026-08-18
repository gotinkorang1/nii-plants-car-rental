import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { ServicePage } from "@/components/marketing/service-page";
import { PAGE_SEO } from "@/lib/content/company";
import { getPublishedFaqs, getPublicLocations } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import { listActiveVehicleClassOptions } from "@/lib/enquiries/queries";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.airport.title,
  description: PAGE_SEO.airport.description,
  path: "/services/airport-transfer",
});

export default async function AirportTransferPage() {
  const [faqs, locations, vehicleClasses] = await Promise.all([
    getPublishedFaqs("Vehicle pickup"),
    getPublicLocations(),
    listActiveVehicleClassOptions(),
  ]);
  const airports = locations.filter((location) => location.type === "airport");

  return (
    <ServicePage
      eyebrow="Airport transfer"
      title="Kotoka airport car hire and transfers"
      lede={
        airports.length > 0
          ? `Pickup and drop-off at ${airports
              .map((item) => item.name)
              .join(", ")}. Share your flight details. Evening collections run until 23:00 by arrangement.`
          : "Airport transfers are arranged from Kotoka International Airport. Share your flight details when you enquire."
      }
      benefits={[
        {
          title: "Meet after landing",
          body: "A driver meets you after you collect luggage. Live flight tracking is not part of this website.",
        },
        {
          title: "Luggage-friendly cars",
          body: "Choose a saloon, SUV, 4x4 or van with the luggage capacity you need, or similar.",
        },
        {
          title: "Evening arrivals",
          body: "Collections after office hours run until 23:00 by arrangement. The Dansoman counter closes at 17:00.",
        },
        {
          title: "Self-drive from the airport",
          body: "Prefer to drive yourself? Collect a self-drive car at Kotoka when that pickup is booked.",
        },
      ]}
      steps={[
        { title: "Request the transfer", body: "Share flight window, passenger count, and luggage." },
        { title: "Confirm the class", body: "Staff match a published vehicle class and send a Ghana cedi quote." },
        { title: "Meet at Kotoka", body: "Exact meeting points are confirmed by operations before you land." },
      ]}
      faqs={faqs}
      form={
        <EnquiryForm
          serviceType="airport_transfer"
          vehicleClasses={vehicleClasses}
          submitLabel="Request a transfer"
        />
      }
    />
  );
}
