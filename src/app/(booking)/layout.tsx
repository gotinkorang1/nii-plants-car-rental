import type { Metadata } from "next";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Book a vehicle",
    template: "%s | Nii Plants Car Rentals",
  },
  description:
    "Reserve a vehicle with Nii Plants Car Rentals and manage your booking online.",
};

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingChrome>{children}</MarketingChrome>;
}
