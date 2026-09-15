import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { marketingImages } from "@/lib/content/marketing-images";

describe("marketingImages", () => {
  it("points at unique public files that exist on disk", () => {
    const srcs = Object.values(marketingImages).map((image) => image.src);
    expect(new Set(srcs).size).toBe(srcs.length);

    for (const image of Object.values(marketingImages)) {
      expect(image.src.startsWith("/images/")).toBe(true);
      expect(image.alt.length).toBeGreaterThan(12);
      const filePath = path.join(process.cwd(), "public", image.src.replace(/^\//, ""));
      expect(existsSync(filePath), filePath).toBe(true);
    }
  });
});
