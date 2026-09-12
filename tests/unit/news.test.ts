import { describe, expect, it } from "vitest";

import { getNewsArticle, NEWS_ARTICLES } from "@/lib/content/news";

describe("news articles", () => {
  it("exposes unique slugs and dated Accra stories", () => {
    const slugs = NEWS_ARTICLES.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(NEWS_ARTICLES.length).toBeGreaterThanOrEqual(3);
    expect(NEWS_ARTICLES.every((article) => article.paragraphs.length > 0)).toBe(true);
  });

  it("uses Alisa and partner-hotel photos on the Accra and Takoradi desks story", () => {
    const article = getNewsArticle("accra-and-takoradi-hotel-desks");
    expect(article?.image.src).toBe("/images/alisa-hotel-north-ridge.webp");
    expect(article?.image.alt).toMatch(/Alisa Hotel North Ridge/);
    expect(article?.image.alt).toMatch(/Accra/);
    expect(article?.image.alt).toMatch(/pickup/);
    expect(article?.bodyImages?.map((image) => image.src)).toEqual([
      "/images/alisa-hotel-north-ridge.webp",
      "/images/hotel-desk-night.webp",
      "/images/hotel-buffet.webp",
      "/images/hotel-pool.webp",
    ]);
    expect(article?.bodyImages?.[0]?.alt).toMatch(/Alisa Hotel North Ridge/);
    expect(
      article?.bodyImages
        ?.slice(1)
        .every((image) => /partner hotel/.test(image.alt)),
    ).toBe(true);
    expect(article?.paragraphs.join(" ")).toMatch(/Best Western Plus Atlantic Hotel/);
    expect(
      article?.bodyImages?.some((image) => /Takoradi/i.test(image.alt)),
    ).toBe(false);
  });

  it("looks up a published article by slug", () => {
    const article = getNewsArticle("plantsville-dansoman-office");
    expect(article?.title).toMatch(/Plantsville/i);
    expect(getNewsArticle("missing")).toBeUndefined();
  });

  it("uses Plantsville office photos on the Dansoman story", () => {
    const article = getNewsArticle("plantsville-dansoman-office");
    expect(article?.image.src).toBe("/images/plantsville-lounge.webp");
    expect(article?.bodyImages?.map((image) => image.src)).toEqual([
      "/images/plantsville-lounge.webp",
      "/images/plantsville-crescent-lounge.webp",
      "/images/plantsville-waiting-room.webp",
    ]);
    expect(article?.image.alt).toMatch(/Plantsville/);
    expect(article?.image.alt).toMatch(/Dansoman/);
    expect(article?.bodyImages?.every((image) => /Accra/.test(image.alt))).toBe(
      true,
    );
  });

  it("uses GTA awards photography on the 2022/2024 awards story without retitling it as a 2021 win", () => {
    const article = getNewsArticle("gta-tourism-awards-car-rental");
    expect(article?.title).not.toMatch(/2021/);
    expect(article?.excerpt).toMatch(/2022/);
    expect(article?.excerpt).toMatch(/2024/);
    expect(article?.image.src).toBe("/images/gta-awards-handshake.webp");
    expect(article?.image.alt).toMatch(/National Tourism Awards 2021/);
    expect(article?.bodyImages?.map((image) => image.src)).toEqual([
      "/images/gta-awards-trophy.webp",
      "/images/gta-awards-group.webp",
      "/images/gta-awards-certificate.webp",
    ]);
    expect(article?.bodyImages?.[0]?.alt).toMatch(/National Tourism Awards 2021/);
    expect(article?.bodyImages?.[2]?.alt).toMatch(
      /Greater Accra Regional Tourism Awards certificate naming Nii Plants/,
    );
  });
});
