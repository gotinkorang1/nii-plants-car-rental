import type { Metadata } from "next";

import { MarketingChrome } from "@/components/marketing/marketing-chrome";

export const dynamic = "force-dynamic";

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
