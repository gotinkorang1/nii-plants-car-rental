import type { MetadataRoute } from "next";

import { getPublishedContentPages } from "@/lib/content/queries";
import { publicEnv } from "@/lib/env";
import { getPublicModels } from "@/lib/fleet/get-public-models";
import { log } from "@/lib/logger";

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
  let models: Awaited<ReturnType<typeof getPublicModels>> = [];
  let pages: Awaited<ReturnType<typeof getPublishedContentPages>> = [];

  try {
    [models, pages] = await Promise.all([
      getPublicModels(),
      getPublishedContentPages(),
    ]);
  } catch (error) {
    log("error", "Failed to load sitemap catalogue entries.", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }

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
