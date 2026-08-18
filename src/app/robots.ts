import type { MetadataRoute } from "next";

import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/booking", "/book/complete", "/payment/", "/api/"],
      },
    ],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
