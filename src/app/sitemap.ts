import type { MetadataRoute } from "next";

import { getPublishedContentPages } from "@/lib/content/queries";
import { getPublicModels } from "@/lib/fleet/get-public-models";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

const staticPaths = [
  "/",
  "/fleet",
  "/services",
  "/services/self-drive",
  "/services/chauffeur",
  "/services/airport-transfer",
  "/services/long-term",
  "/services/events",
  "/corporate",
  "/about",
  "/help",
  "/help/requirements",
  "/help/faqs",
  "/contact",
  "/book",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
  const [models, pages] = await Promise.all([
    getPublicModels(),
    getPublishedContentPages(),
  ]);

  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  for (const model of models) {
    entries.push({
      url: `${base}/fleet/${model.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const page of pages) {
    entries.push({
      url: `${base}/${page.slug}`,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
