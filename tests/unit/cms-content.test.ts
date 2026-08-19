import { describe, expect, it } from "vitest";

import { isReservedPublicSlug } from "@/lib/content/reserved-slugs";
import { sanitizeCmsHtml } from "@/lib/content/sanitize-html";
import { cmsSeoDescription, cmsSeoTitle } from "@/lib/content/seo";
import { parseVideoEmbedUrl } from "@/lib/content/video-embed";
import { canManageCms } from "@/lib/content/permissions";
import {
  contentPageSchema,
  contentPostSchema,
  faqSchema,
  mediaAssetMetadataSchema,
} from "@/lib/validation/content";
import { parseSiteSettingsRecord } from "@/lib/settings/schema";

describe("reserved public slugs", () => {
  it("blocks application-owned first path segments", () => {
    expect(isReservedPublicSlug("admin")).toBe(true);
    expect(isReservedPublicSlug("API")).toBe(true);
    expect(isReservedPublicSlug("book")).toBe(true);
    expect(isReservedPublicSlug("booking")).toBe(true);
    expect(isReservedPublicSlug("news")).toBe(true);
    expect(isReservedPublicSlug("gallery")).toBe(true);
    expect(isReservedPublicSlug("admin/pages")).toBe(true);
  });

  it("allows staff CMS slugs that do not collide", () => {
    expect(isReservedPublicSlug("driving-in-ghana")).toBe(false);
    expect(isReservedPublicSlug("airport-guide")).toBe(false);
  });
});

describe("CMS page validation", () => {
  it("sanitizes body HTML and fills a slug from the title", () => {
    const parsed = contentPageSchema.parse({
      title: "Visitor notes",
      slug: "",
      excerpt: "Short excerpt",
      body: '<p>Hello</p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>',
      published: false,
    });

    expect(parsed.slug).toBe("visitor-notes");
    expect(parsed.body).toContain("<p>Hello</p>");
    expect(parsed.body).not.toContain("script");
    expect(parsed.body).not.toContain("javascript:");
  });

  it("rejects reserved slugs server-side", () => {
    const parsed = contentPageSchema.safeParse({
      title: "Admin collision",
      slug: "admin",
      excerpt: "",
      body: "<p>Body</p>",
      published: true,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/reserved/i);
    }
  });

  it("rejects other application routes", () => {
    for (const slug of ["fleet", "book", "api", "booking"]) {
      const parsed = contentPageSchema.safeParse({
        title: "Collision",
        slug,
        body: "<p>Body</p>",
      });
      expect(parsed.success, slug).toBe(false);
    }
  });
});

describe("CMS post validation", () => {
  it("accepts a news story and a YouTube video post", () => {
    const news = contentPostSchema.parse({
      kind: "news",
      title: "GTA awards in Accra",
      slug: "",
      excerpt: "Confirmed award news.",
      body: "<p>The ceremony was in Accra.</p>",
      published: true,
      publishedOn: "2024-10-25",
    });
    expect(news.slug).toBe("gta-awards-in-accra");
    expect(news.kind).toBe("news");

    const video = contentPostSchema.parse({
      kind: "video",
      title: "Plantsville walkthrough",
      body: "",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      published: false,
    });
    expect(video.videoUrl).toContain("youtube.com");
  });

  it("rejects a video post without a YouTube or Vimeo link", () => {
    const parsed = contentPostSchema.safeParse({
      kind: "video",
      title: "Clip",
      videoUrl: "https://example.com/not-a-video",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("video embed URLs", () => {
  it("rewrites YouTube and Vimeo links to privacy-safe embeds", () => {
    expect(parseVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(
      parseVideoEmbedUrl("https://vimeo.com/123456789"),
    ).toBe("https://player.vimeo.com/video/123456789");
    expect(parseVideoEmbedUrl("https://example.com/watch")).toBeNull();
  });
});

describe("FAQ validation", () => {
  it("accepts a published FAQ in a known category", () => {
    const parsed = faqSchema.parse({
      question: "How do I book?",
      answer: "Use Check availability.",
      category: "Booking",
      sortOrder: "2",
      published: true,
    });

    expect(parsed.sortOrder).toBe(2);
    expect(parsed.published).toBe(true);
  });

  it("rejects an unknown category and a blank question", () => {
    expect(
      faqSchema.safeParse({
        question: "  ",
        answer: "Answer",
        category: "Booking",
      }).success,
    ).toBe(false);
    expect(
      faqSchema.safeParse({
        question: "How?",
        answer: "Answer",
        category: "Awards",
      }).success,
    ).toBe(false);
  });
});

describe("SEO fallbacks", () => {
  it("falls back from SEO title to page title", () => {
    expect(cmsSeoTitle({ title: "Guide", seoTitle: "  " })).toBe("Guide");
    expect(cmsSeoTitle({ title: "Guide", seoTitle: "Airport guide" })).toBe(
      "Airport guide",
    );
  });

  it("falls back from SEO description to excerpt and does not invent copy", () => {
    expect(
      cmsSeoDescription({ excerpt: "Short excerpt", seoDescription: null }),
    ).toBe("Short excerpt");
    expect(cmsSeoDescription({ excerpt: "  ", seoDescription: "  " })).toBeUndefined();
  });

  it("truncates long meta descriptions to 160 characters", () => {
    const long = "A".repeat(200);
    const truncated = cmsSeoDescription({ excerpt: long, seoDescription: null });
    expect(truncated?.length).toBeLessThanOrEqual(160);
    expect(truncated?.endsWith("…")).toBe(true);
  });
});

describe("media metadata", () => {
  it("requires alt text", () => {
    expect(mediaAssetMetadataSchema.safeParse({ altText: "  " }).success).toBe(
      false,
    );
    expect(
      mediaAssetMetadataSchema.parse({ altText: "White sedan, side view" }).altText,
    ).toBe("White sedan, side view");
  });
});

describe("CMS permissions", () => {
  it("allows administrators and content editors to manage CMS", () => {
    expect(canManageCms("administrator")).toBe(true);
    expect(canManageCms("content_editor")).toBe(true);
    expect(canManageCms("fleet")).toBe(false);
    expect(canManageCms("reservations")).toBe(false);
    expect(canManageCms("finance")).toBe(false);
  });
});

describe("site settings homepage fields", () => {
  it("uses homepage copy without inventing extra contact fields when they are blanked", () => {
    const parsed = parseSiteSettingsRecord({
      homepageHeadline: "Cars for moving through Ghana.",
      homepageSubheadline: "Self-drive first.",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
    });

    expect(parsed.phone).toBe("");
    expect(parsed.homepageHeadline).toBe("Cars for moving through Ghana.");
  });
});

describe("HTML sanitizer", () => {
  it("strips event handlers and keeps safe links", () => {
    const html = sanitizeCmsHtml(
      '<p onclick="steal()">Safe</p><a href="/fleet">Fleet</a><a href="https://example.com">Out</a>',
    );

    expect(html).not.toContain("onclick");
    expect(html).toContain('<a href="/fleet">');
    expect(html).toContain('<a href="https://example.com">');
  });
});
