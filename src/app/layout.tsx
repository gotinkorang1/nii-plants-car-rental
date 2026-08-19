import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

import { PAGE_SEO } from "@/lib/content/company";
import { publicEnv } from "@/lib/env";
import { shouldNoIndexPublicSite } from "@/lib/env/runtime-environment";
import { cn } from "@/lib/utils";

import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-interface",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: publicEnv.NEXT_PUBLIC_APP_URL
    ? new URL(publicEnv.NEXT_PUBLIC_APP_URL)
    : undefined,
  title: {
    default: PAGE_SEO.home.title,
    template: "%s | Nii Plants Car Rentals",
  },
  description: PAGE_SEO.home.description,
  openGraph: {
    type: "website",
    siteName: "Nii Plants Car Rentals",
    locale: "en_GH",
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    images: ["/images/og-default.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
  ...(shouldNoIndexPublicSite()
    ? {
        robots: {
          index: false,
          follow: false,
          nocache: true,
        },
      }
    : {}),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("font-sans", sourceSans.variable, sourceSerif.variable)}
    >
      <body>{children}</body>
    </html>
  );
}
