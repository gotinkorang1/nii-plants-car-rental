import type { Metadata } from "next";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";

// Public marketing pages are cached and regenerated at most hourly (ISR) so
// visits and crawler traffic are served static HTML from the CDN instead of
// invoking a server render on every request. Pages that need per-request data
// (fleet list with search params, enquiry confirmation) opt back into dynamic
// rendering themselves.
export const revalidate = 3600;

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
