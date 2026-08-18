import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { tryGetDb } from "@/lib/db";
import { contentPages, faqs, locations, mediaAssets } from "@/lib/db/schema";
import { log } from "@/lib/logger";

export async function getPublishedFaqs(category?: string) {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  try {
    return await db
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
  } catch (error) {
    log("error", "Failed to load published FAQs.", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return [];
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
      .where(and(eq(contentPages.slug, slug), eq(contentPages.published, true)))
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
      .where(eq(contentPages.published, true))
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

export async function listContentPagesAdmin() {
  const db = tryGetDb();
  if (!db) {
    return [];
  }

  return db.select().from(contentPages).orderBy(asc(contentPages.title));
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
