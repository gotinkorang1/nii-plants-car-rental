import { describe, expect, it } from "vitest";

import catalog from "@/lib/db/seed-catalog.json";
import {
  AWARDS,
  PAGE_SEO,
  vehicleSeoDescription,
  vehicleSeoTitle,
} from "@/lib/content/company";
import { truncateMetaDescription } from "@/lib/content/seo";
import { faqPageJsonLd } from "@/lib/content/structured-data";

describe("public SEO copy", () => {
  it("keeps titles and descriptions within search-snippet lengths", () => {
    for (const [key, page] of Object.entries(PAGE_SEO)) {
      expect(page.description.length, key).toBeLessThanOrEqual(160);
      if (key === "home") {
        expect(page.title.length).toBeLessThanOrEqual(70);
      } else {
        expect(page.title.length, key).toBeLessThanOrEqual(55);
      }
    }
  });

  it("writes Accra-focused vehicle titles without inventing prices", () => {
    expect(vehicleSeoTitle("Honda", "Accord")).toBe(
      "Honda Accord Hire Accra | Car Rental Ghana",
    );
    const description = vehicleSeoDescription({
      make: "Honda",
      modelName: "Accord",
      className: "Luxury sedan",
      description: "A Honda Accord for executive travel in Accra.",
      seats: 5,
    });
    expect(description).toMatch(/Accra/);
    expect(description.toLowerCase()).not.toContain("ghs");
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("keeps seeded CMS SEO fields within limits", () => {
    for (const page of catalog.contentPages) {
      if ("seoTitle" in page && typeof page.seoTitle === "string") {
        expect(page.seoTitle.length, page.slug).toBeLessThanOrEqual(70);
      }
      if ("seoDescription" in page && typeof page.seoDescription === "string") {
        expect(page.seoDescription.length, page.slug).toBeLessThanOrEqual(160);
      }
    }
  });

  it("records verified awards without inventing review counts", () => {
    expect(AWARDS.length).toBe(3);
    expect(AWARDS.map((item) => item.year)).toEqual([2022, 2024, 2024]);
    expect(AWARDS.some((item) => /best car rental/i.test(item.name))).toBe(true);
  });

  it("omits FAQ schema when there are no questions", () => {
    expect(faqPageJsonLd([])).toBeNull();
    expect(
      faqPageJsonLd([{ question: "How?", answer: "Call us." }])?.["@type"],
    ).toBe("FAQPage");
  });

  it("truncates meta copy and normalizes whitespace", () => {
    expect(truncateMetaDescription("  Short  copy  ")).toBe("Short copy");
    expect(truncateMetaDescription("")).toBeUndefined();
  });
});
