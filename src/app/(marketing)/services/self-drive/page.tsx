import type { Metadata } from "next";

import { ServicePage } from "@/components/marketing/service-page";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublishedFaqs } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import { getSiteSettings } from "@/lib/settings/get-site-settings";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.selfDrive.title,
  description: PAGE_SEO.selfDrive.description,
  path: "/services/self-drive",
});

export default async function SelfDrivePage() {
  const [settings, faqs] = await Promise.all([
    getSiteSettings(),
    getPublishedFaqs("Booking"),
  ]);

  return (
    <ServicePage
      eyebrow="Self-drive"
      title="Self-drive car rental in Accra and Ghana"
      image={marketingImages.selfDrive}
      lede="Hire a published model or similar and drive yourself. Days are 24 hours. Staff confirm the Ghana cedi rate before you pay. Cars stay inside Ghana."
      benefits={[
        {
          title: "Accra and beyond",
          body: "Collect at Plantsville, Dansoman, or Kotoka. Use the car anywhere in Ghana — not across a land border.",
        },
        {
          title: "Reservation payment",
          body: `Pay ${settings.reservationPaymentPercent} percent of the rental total to hold the booking. The balance is due before pickup.`,
        },
        {
          title: "24-hour days",
          body: `Self-drive is charged in 24-hour days, with a minimum of ${settings.minimumRentalHours} hours. Mileage for ordinary Ghana use is included.`,
        },
        {
          title: "Who may drive",
          body: "Renters and extra drivers must be 25 or older, hold a full licence, and bring a Ghana Card or passport.",
        },
      ]}
      steps={[
        { title: "Check dates", body: "Enter pickup and return details for Accra or another published location." },
        { title: "Choose a model", body: "Pick a saloon, SUV or 4x4 — you receive that model or similar." },
        { title: "Confirm and pay", body: "Review the Ghana cedi quote, then pay the reservation." },
      ]}
      faqs={faqs}
      ctaHref="/book"
      ctaLabel="Book a Vehicle"
      secondaryHref="/fleet"
      secondaryLabel="Browse fleet"
    />
  );
}
