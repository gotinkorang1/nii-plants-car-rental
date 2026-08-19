import "server-only";

import { GALLERY_ALBUMS } from "@/lib/content/gallery";
import { getWebsiteMediaPublicUrl } from "@/lib/content/media-url";
import { marketingImages, type MarketingImage } from "@/lib/content/marketing-images";
import { NEWS_ARTICLES } from "@/lib/content/news";
import {
  getPublishedStoryRow,
  listPublishedGalleryRows,
  listPublishedStoryRows,
} from "@/lib/content/queries";
import { parseVideoEmbedUrl } from "@/lib/content/video-embed";
import type { ContentStoryKind } from "@/lib/validation/content";

export type PublicStory = {
  kind: ContentStoryKind;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  date: string;
  dateLabel: string;
  image: MarketingImage;
  videoEmbedUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type PublicGalleryAlbum = {
  id: string;
  title: string;
  body: string;
  images: MarketingImage[];
};

const fallbackCover = marketingImages.workshop;

function dateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function isoDate(value: Date | null, fallback: Date): string {
  const date = value ?? fallback;
  return date.toISOString().slice(0, 10);
}

function coverImage(
  storagePath: string | null,
  altText: string | null,
  fallbackAlt: string,
): MarketingImage {
  if (!storagePath) {
    return { ...fallbackCover, alt: fallbackAlt };
  }
  const src = getWebsiteMediaPublicUrl(storagePath);
  if (!src) {
    return { ...fallbackCover, alt: fallbackAlt };
  }
  return {
    src,
    alt: altText?.trim() || fallbackAlt,
    width: 1600,
    height: 1067,
  };
}

function fromStaticArticle(
  article: (typeof NEWS_ARTICLES)[number],
): PublicStory {
  return {
    kind: "news",
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    bodyHtml: article.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join(""),
    date: article.date,
    dateLabel: article.dateLabel,
    image: article.image,
    videoEmbedUrl: null,
    seoTitle: null,
    seoDescription: null,
  };
}

function fromStoryRow(
  row: NonNullable<Awaited<ReturnType<typeof getPublishedStoryRow>>>,
): PublicStory | null {
  if (row.kind !== "news" && row.kind !== "blog" && row.kind !== "video") {
    return null;
  }

  const date = isoDate(row.publishedAt, row.updatedAt);
  return {
    kind: row.kind,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    bodyHtml: row.body,
    date,
    dateLabel: dateLabel(date),
    image: coverImage(row.coverPath, row.coverAlt, row.title),
    videoEmbedUrl: row.videoUrl ? parseVideoEmbedUrl(row.videoUrl) : null,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
  };
}

export async function listPublishedStories(): Promise<PublicStory[]> {
  const rows = await listPublishedStoryRows();
  const bySlug = new Map<string, PublicStory>();

  for (const article of NEWS_ARTICLES) {
    bySlug.set(article.slug, fromStaticArticle(article));
  }

  for (const row of rows) {
    const story = fromStoryRow(row);
    if (story) {
      bySlug.set(story.slug, story);
    }
  }

  return [...bySlug.values()].sort((left, right) =>
    right.date.localeCompare(left.date),
  );
}

export async function getPublishedStory(
  slug: string,
): Promise<PublicStory | undefined> {
  const row = await getPublishedStoryRow(slug);
  if (row) {
    return fromStoryRow(row) ?? undefined;
  }
  const article = NEWS_ARTICLES.find((item) => item.slug === slug);
  return article ? fromStaticArticle(article) : undefined;
}

export async function listPublishedGalleryAlbums(): Promise<PublicGalleryAlbum[]> {
  const rows = await listPublishedGalleryRows();
  const byId = new Map<string, PublicGalleryAlbum>();

  for (const album of GALLERY_ALBUMS) {
    byId.set(album.id, album);
  }

  for (const album of rows) {
    byId.set(album.slug, {
      id: album.slug,
      title: album.title,
      body: album.excerpt || album.body.replace(/<[^>]+>/g, " ").trim(),
      images: album.images.flatMap((image) => {
        const src = getWebsiteMediaPublicUrl(image.storagePath);
        if (!src) {
          return [];
        }
        return [
          {
            src,
            alt: image.caption?.trim() || image.altText,
            width: 1600,
            height: 1067,
          },
        ];
      }),
    });
  }

  return [...byId.values()];
}
