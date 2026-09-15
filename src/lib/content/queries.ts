import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { PUBLIC_FAQS } from "@/lib/content/copy";
import { tryGetDb } from "@/lib/db";
import {
  contentPageMedia,
  contentPages,
  faqs,
  locations,
  mediaAssets,
} from "@/lib/db/schema";
import { log } from "@/lib/logger";
import type { ContentPostKind } from "@/lib/validation/content";
import { CONTENT_STORY_KINDS } from "@/lib/validation/content";
import { SUPPORTED_OFFICE_PICKUP_LOCATION_SLUGS } from "@/lib/content/location-type";

export async function getPublishedFaqs(category?: string) {
  const fallback = PUBLIC_FAQS.filter((item) =>
    category ? item.category === category : true,
  ).map((item) => ({
    id: item.id,
    question: item.question,
    answer: item.answer,
    category: item.category,
    sortOrder: item.sortOrder,
  }));

  const db = tryGetDb();
  if (!db) {
    return fallback;
  }

  try {
    const rows = await db
      .select({
        id: faqs.id,
        question: faqs.question,
        answer: faqs.answer,
        category: faqs.category,
        sortOrder: faqs.sortOrder,
      })
      .from(faqs)
      .where(
        category
          ? and(eq(faqs.published, true), eq(faqs.category, category))
          : eq(faqs.published, true),
      )
      .orderBy(asc(faqs.category), asc(faqs.sortOrder), asc(faqs.question));
    return rows.length > 0 ? rows : fallback;
  } catch (error) {
    log("error", "Failed to load published FAQs.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return fallback;
  }
}

export async function getPublishedContentPage(slug: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  try {
    const [row] = await db
      .select()
      .from(contentPages)
      .where(
        and(
          eq(contentPages.slug, slug),
          eq(contentPages.published, true),
          eq(contentPages.kind, "page"),
        ),
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    log("error", "Failed to load published CMS page.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

export async function getPublishedContentPages() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        slug: contentPages.slug,
        title: contentPages.title,
        excerpt: contentPages.excerpt,
        updatedAt: contentPages.updatedAt,
      })
      .from(contentPages)
      .where(and(eq(contentPages.published, true), eq(contentPages.kind, "page")))
      .orderBy(asc(contentPages.title));
  } catch (error) {
    log("error", "Failed to load published CMS pages.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

export async function getPublicLocations() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        id: locations.id,
        name: locations.name,
        slug: locations.slug,
        type: locations.type,
        address: locations.address,
        latitude: locations.latitude,
        longitude: locations.longitude,
      })
      .from(locations)
      .where(eq(locations.active, true))
      .orderBy(asc(locations.name));
  } catch (error) {
    log("error", "Failed to load public locations.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

export async function getPublicOfficePickupLocations() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        id: locations.id,
        name: locations.name,
        slug: locations.slug,
        type: locations.type,
        address: locations.address,
        latitude: locations.latitude,
        longitude: locations.longitude,
      })
      .from(locations)
      .where(
        and(
          eq(locations.active, true),
          inArray(locations.slug, [...SUPPORTED_OFFICE_PICKUP_LOCATION_SLUGS]),
        ),
      )
      .orderBy(asc(locations.name));
  } catch (error) {
    log("error", "Failed to load office pickup locations.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

export async function listContentPagesAdmin() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(contentPages)
    .where(eq(contentPages.kind, "page"))
    .orderBy(asc(contentPages.title));
}

export async function listContentPostsAdmin(kinds: readonly ContentPostKind[]) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(contentPages)
    .where(inArray(contentPages.kind, [...kinds]))
    .orderBy(desc(contentPages.publishedAt), desc(contentPages.updatedAt));
}

export async function listContentPageMedia(pageId: string) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select({
      id: contentPageMedia.id,
      mediaId: contentPageMedia.mediaId,
      caption: contentPageMedia.caption,
      sortOrder: contentPageMedia.sortOrder,
      storagePath: mediaAssets.storagePath,
      altText: mediaAssets.altText,
    })
    .from(contentPageMedia)
    .innerJoin(mediaAssets, eq(contentPageMedia.mediaId, mediaAssets.id))
    .where(eq(contentPageMedia.pageId, pageId))
    .orderBy(asc(contentPageMedia.sortOrder));
}

export async function listPublishedStoryRows() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    return await db
      .select({
        id: contentPages.id,
        kind: contentPages.kind,
        slug: contentPages.slug,
        title: contentPages.title,
        excerpt: contentPages.excerpt,
        body: contentPages.body,
        videoUrl: contentPages.videoUrl,
        seoTitle: contentPages.seoTitle,
        seoDescription: contentPages.seoDescription,
        publishedAt: contentPages.publishedAt,
        updatedAt: contentPages.updatedAt,
        coverPath: mediaAssets.storagePath,
        coverAlt: mediaAssets.altText,
      })
      .from(contentPages)
      .leftJoin(mediaAssets, eq(contentPages.coverMediaId, mediaAssets.id))
      .where(
        and(
          eq(contentPages.published, true),
          inArray(contentPages.kind, [...CONTENT_STORY_KINDS]),
        ),
      )
      .orderBy(desc(contentPages.publishedAt), desc(contentPages.updatedAt));
  } catch (error) {
    log("error", "Failed to load published stories.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

export async function getPublishedStoryRow(slug: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  try {
    const [row] = await db
      .select({
        id: contentPages.id,
        kind: contentPages.kind,
        slug: contentPages.slug,
        title: contentPages.title,
        excerpt: contentPages.excerpt,
        body: contentPages.body,
        videoUrl: contentPages.videoUrl,
        seoTitle: contentPages.seoTitle,
        seoDescription: contentPages.seoDescription,
        publishedAt: contentPages.publishedAt,
        updatedAt: contentPages.updatedAt,
        coverPath: mediaAssets.storagePath,
        coverAlt: mediaAssets.altText,
      })
      .from(contentPages)
      .leftJoin(mediaAssets, eq(contentPages.coverMediaId, mediaAssets.id))
      .where(
        and(
          eq(contentPages.slug, slug),
          eq(contentPages.published, true),
          inArray(contentPages.kind, [...CONTENT_STORY_KINDS]),
        ),
      )
      .limit(1);
    return row ?? null;
  } catch (error) {
    log("error", "Failed to load a published story.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return null;
  }
}

export async function listPublishedGalleryRows() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    const albums = await db
      .select({
        id: contentPages.id,
        slug: contentPages.slug,
        title: contentPages.title,
        excerpt: contentPages.excerpt,
        body: contentPages.body,
        sortOrder: contentPages.sortOrder,
        publishedAt: contentPages.publishedAt,
      })
      .from(contentPages)
      .where(
        and(eq(contentPages.published, true), eq(contentPages.kind, "gallery")),
      )
      .orderBy(asc(contentPages.sortOrder), desc(contentPages.publishedAt));

    if (albums.length === 0) {
      return [];
    }

    const albumIds = albums.map((album) => album.id);
    const media = await db
      .select({
        pageId: contentPageMedia.pageId,
        storagePath: mediaAssets.storagePath,
        altText: mediaAssets.altText,
        caption: contentPageMedia.caption,
        sortOrder: contentPageMedia.sortOrder,
      })
      .from(contentPageMedia)
      .innerJoin(mediaAssets, eq(contentPageMedia.mediaId, mediaAssets.id))
      .where(inArray(contentPageMedia.pageId, albumIds))
      .orderBy(asc(contentPageMedia.sortOrder));

    return albums.map((album) => ({
      ...album,
      images: media.filter((item) => item.pageId === album.id),
    }));
  } catch (error) {
    log("error", "Failed to load published gallery albums.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
  }
}

export async function getContentPageAdmin(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db
    .select()
    .from(contentPages)
    .where(eq(contentPages.id, id))
    .limit(1);
  return row ?? null;
}

export async function listFaqsAdmin() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db
    .select()
    .from(faqs)
    .orderBy(asc(faqs.category), asc(faqs.sortOrder), asc(faqs.question));
}

export async function getFaqAdmin(id: string) {
  const db = tryGetDb();
  if (!db) {
    return null;
  }

  const [row] = await db.select().from(faqs).where(eq(faqs.id, id)).limit(1);
  return row ?? null;
}

export async function listMediaAssetsAdmin() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db.select().from(mediaAssets).orderBy(asc(mediaAssets.originalFilename));
}
