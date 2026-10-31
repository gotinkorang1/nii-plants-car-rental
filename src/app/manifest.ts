import type { MetadataRoute } from "next";

import { PAGE_SEO } from "@/lib/content/company";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nii Plants Car Rentals",
    short_name: "Nii Plants",
    description: PAGE_SEO.home.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f3eb",
    theme_color: "#1f5c46",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
