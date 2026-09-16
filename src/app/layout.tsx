import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL(
    publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  applicationName: "Nii Plants Car Rentals",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nii Plants Car Rentals",
  },
  icons: [
    {
      url: "/icons/icon-192.png",
      type: "image/png",
      sizes: "192x192",
    },
    {
      url: "/icons/icon-512.png",
      type: "image/png",
      sizes: "512x512",
    },
  ],
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

export const viewport: Viewport = {
  themeColor: "#1f5c46",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
