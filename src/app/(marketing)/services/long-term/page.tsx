import type { Metadata } from "next";

import { EnquiryForm } from "@/components/enquiries/enquiry-form";
import { ServicePage } from "@/components/marketing/service-page";
import { PAGE_SEO } from "@/lib/content/company";
import { marketingImages } from "@/lib/content/marketing-images";
import { getPublishedFaqs } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/content/seo";
import { listActiveVehicleClassOptions } from "@/lib/enquiries/queries";

export const metadata: Metadata = pageMetadata({
  title: PAGE_SEO.longTerm.title,
  description: PAGE_SEO.longTerm.description,
  path: "/services/long-term",
});

export default async function LongTermPage() {
  const [faqs, vehicleClasses] = await Promise.all([
    getPublishedFaqs("Booking"),
    listActiveVehicleClassOptions(),
  ]);

  return (
    <ServicePage
      eyebrow="Long-term"
      title="Long-term car rental in Ghana"
      image={marketingImages.longTerm}
      lede="Keep a Nii Plants car for a week, a month, or a longer assignment in Accra and across Ghana. Staff quote weekly and monthly packages. There is no automated monthly price list on this site."
      benefits={[
        {
          title: "Weekly and monthly",
          body: "Typical packages cover one to three weeks, or one to eleven months. Ask staff for the right window.",
        },
        {
          title: "Business cover",
          body: "Temporary cars for project teams, secondments, and visiting employees.",
        },
        {
          title: "Extended stays",
          body: "Visitor or relocation transport, quoted in Ghana cedis, with maintenance included in the hire.",
        },
        {
          title: "Longer assignments",
          body: "Multi-year hire, including a possible option to buy, is discussed with staff — not booked as a standard self-drive day.",
        },
      ]}
      steps={[
        { title: "Tell us the duration", body: "Start and end windows, even if approximate." },
        { title: "Choose a class", body: "Browse published Accra models for the right size." },
        { title: "Receive a quote", body: "Staff send Ghana cedi terms for the agreed period." },
      ]}
      faqs={faqs}
      form={
        <EnquiryForm
          serviceType="long_term"
          vehicleClasses={vehicleClasses}
          submitLabel="Request long-term quote"
        />
      }
    />
  );
}
