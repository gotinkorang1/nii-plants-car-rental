import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("public CMS data access", () => {
  it("only returns published FAQs and CMS pages to the public site", () => {
    const source = readSource("src/lib/content/queries.ts");

    expect(source).toContain("eq(faqs.published, true)");
    expect(source).toContain("eq(contentPages.published, true)");
    expect(source).not.toContain("eq(faqs.published, false)");
    expect(source).not.toContain("eq(contentPages.published, false)");
  });

  it("blocks reserved CMS slugs before a public page is rendered", () => {
    const source = readSource("src/app/(marketing)/[slug]/page.tsx");

    expect(source).toContain("isReservedPublicSlug");
    expect(source).toContain("notFound()");
  });
});

describe("phase 3 CMS RLS and storage SQL", () => {
  it("does not grant anonymous SELECT on CMS tables", () => {
    const sql = readSource("drizzle/0003_phase3_cms.sql");

    expect(sql).toMatch(
      /REVOKE ALL ON TABLE public\.content_pages FROM PUBLIC, anon, authenticated/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON TABLE public\.faqs FROM PUBLIC, anon, authenticated/,
    );
    expect(sql).toMatch(
      /REVOKE ALL ON TABLE public\.media_assets FROM PUBLIC, anon, authenticated/,
    );
    expect(sql).not.toMatch(/GRANT SELECT ON TABLE public\.content_pages TO anon/);
    expect(sql).not.toMatch(/GRANT SELECT ON TABLE public\.faqs TO anon/);
    expect(sql).toContain("website-media");
    expect(sql).toContain("is_active_staff()");
  });
});

describe("sitemap exclusions", () => {
  it("includes static public pages and published content only", () => {
    const source = readSource("src/app/sitemap.ts");

    expect(source).toContain('"/fleet"');
    expect(source).toContain("getPublishedContentPages");
    expect(source).toContain("getPublicModels");
    expect(source).not.toContain("/admin");
    expect(source).not.toContain("/api");
  });
});
