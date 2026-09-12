import type { Metadata } from "next";

import { publicEnv } from "@/lib/env";

export function truncateMetaDescription(
  text: string,
  max = 160,
): string | undefined {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return undefined;
  }
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function cmsSeoTitle(page: {
  title: string;
  seoTitle?: string | null;
}): string {
  const seo = page.seoTitle?.trim();
  return seo && seo.length > 0 ? seo : page.title;
}

export function cmsSeoDescription(page: {
  excerpt: string;
  seoDescription?: string | null;
}): string | undefined {
  const seo = page.seoDescription?.trim();
  if (seo && seo.length > 0) {
    return truncateMetaDescription(seo);
  }

  return truncateMetaDescription(page.excerpt);
}

export const DEFAULT_OG_IMAGE = "/images/og-default.jpg";

export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  absolute?: boolean;
  images?: string[];
  keywords?: string[];
}): Metadata {
  const description = truncateMetaDescription(input.description) ?? input.description;
  const canonicalPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const url = publicEnv.NEXT_PUBLIC_APP_URL
    ? `${publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}${canonicalPath}`
    : canonicalPath;
  const images = input.images?.length ? input.images : [DEFAULT_OG_IMAGE];

  return {
    title: input.absolute ? { absolute: input.title } : input.title,
    description,
    keywords: input.keywords,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: input.title,
      description,
      url,
      images,
      locale: "en_GH",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      images,
    },
  };
}
