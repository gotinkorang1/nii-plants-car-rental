import type { Metadata } from "next";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";

// Public content is updated through the staff console, not per request.
// Refresh it every five minutes to avoid repeated database work for visitors.
export const revalidate = 300;

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Nii Plants Car Rentals",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MarketingChrome>{children}</MarketingChrome>;
}
