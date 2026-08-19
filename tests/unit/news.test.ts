import { describe, expect, it } from "vitest";

import { getNewsArticle, NEWS_ARTICLES } from "@/lib/content/news";

describe("news articles", () => {
  it("exposes unique slugs and dated Accra stories", () => {
    const slugs = NEWS_ARTICLES.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(NEWS_ARTICLES.length).toBeGreaterThanOrEqual(3);
    expect(NEWS_ARTICLES.every((article) => article.paragraphs.length > 0)).toBe(true);
  });

  it("looks up a published article by slug", () => {
    const article = getNewsArticle("plantsville-dansoman-office");
    expect(article?.title).toMatch(/Plantsville/i);
    expect(getNewsArticle("missing")).toBeUndefined();
  });
});
