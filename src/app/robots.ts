import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep crawlers out of the admin area, the whole transactional booking
        // funnel, enquiry confirmations, payments and API routes. These are
        // dynamic, per-request pages that should never be indexed — letting
        // bots crawl them wastes serverless renders.
        disallow: [
          "/admin",
          "/booking",
          "/book",
          "/enquiry/complete",
          "/payment/",
          "/api/",
        ],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
