import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { ServicePage } from "@/components/marketing/service-page";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublishedFaqs } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import { listActiveVehicleClassOptions } from "@/lib/enquiries/queries";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.chauffeur.title,
  description: PAGE_SEO.chauffeur.description,
  path: "/services/chauffeur",
});

export default async function ChauffeurPage() {
  const [faqs, vehicleClasses] = await Promise.all([
    getPublishedFaqs("Support"),
    listActiveVehicleClassOptions(),
  ]);

  return (
    <ServicePage
      eyebrow="Chauffeur"
      title="Chauffeur service in Accra — a driven car for your day"
      image={marketingImages.chauffeurWelcome}
      lede="Book a professional driver with a Nii Plants sedan, SUV or 4x4. Daily chauffeur hire is a 10-hour duty day. Short jobs start at three hours. Staff quote overtime and intercity trips."
      benefits={[
        { title: "Business days", body: "Meetings and client calls without parking or Accra traffic stress." },
        { title: "Visitors", body: "Useful when guests should not self-drive in Ghana." },
        { title: "Duty day", body: "A chauffeur day is 10 hours. The three-hour minimum covers airport runs." },
        { title: "Intercity", body: "Cape Coast, Kumasi and other routes are reviewed before confirmation." },
      ]}
      steps={[
        { title: "Request", body: "Describe dates, passengers, and the route." },
        { title: "Review", body: "Staff confirm vehicle class, the 10-hour window, and the Ghana cedi quote." },
        { title: "Travel", body: "A company driver is assigned operationally after you accept the quote." },
      ]}
      faqs={faqs}
      form={
        <EnquiryForm
          serviceType="chauffeur"
          vehicleClasses={vehicleClasses}
          submitLabel="Request chauffeur service"
        />
      }
    />
  );
}
