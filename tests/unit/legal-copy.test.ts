import { describe, expect, it } from "vitest";

import { PAGE_SEO } from "@/lib/content/company";
import {
  PRIVACY_INTRO,
  PRIVACY_SECTIONS,
  TERMS_INTRO,
  TERMS_SECTIONS,
} from "@/lib/content/legal";
import { isReservedPublicSlug } from "@/lib/content/reserved-slugs";

function legalText() {
  return [
    PRIVACY_INTRO,
    TERMS_INTRO,
    ...PRIVACY_SECTIONS.flatMap((section) => section.paragraphs),
    ...TERMS_SECTIONS.flatMap((section) => section.paragraphs),
  ].join("\n");
}

describe("public privacy and hire terms", () => {
  it("keeps reserved slugs for /privacy and /terms", () => {
    expect(isReservedPublicSlug("privacy")).toBe(true);
    expect(isReservedPublicSlug("terms")).toBe(true);
  });

  it("states Act 843, 48-hour cancel, and Ghana hire rules", () => {
    const text = legalText();
    expect(text).toMatch(/Act 843/);
    expect(text).toMatch(/48 hours/);
    expect(text).toMatch(/Paystack/);
    expect(text).toMatch(/25 or older/);
    expect(text).toMatch(/24-hour/);
    expect(text).toMatch(/10 hours/);
    expect(text).not.toMatch(/Sakaman/);
    expect(text.toLowerCase()).not.toContain("unlimited km");
  });

  it("does not treat a chauffeur day as the self-drive rule", () => {
    const days = TERMS_SECTIONS.find((section) => section.id === "days");
    expect(days?.paragraphs.join(" ")).toMatch(/Self-drive is charged in 24-hour days/);
    expect(days?.paragraphs.join(" ")).toMatch(/chauffeur or airport duty day is 10 hours/);
  });

  it("keeps legal SEO titles and descriptions within snippet lengths", () => {
    expect(PAGE_SEO.privacy.title.length).toBeLessThanOrEqual(55);
    expect(PAGE_SEO.privacy.description.length).toBeLessThanOrEqual(160);
    expect(PAGE_SEO.terms.title.length).toBeLessThanOrEqual(55);
    expect(PAGE_SEO.terms.description.length).toBeLessThanOrEqual(160);
  });
});
