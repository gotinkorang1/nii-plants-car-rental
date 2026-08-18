import { describe, expect, it } from "vitest";

import { osmBrowseUrl, osmEmbedUrl } from "@/lib/maps/openstreetmap";

describe("OpenStreetMap helpers", () => {
  it("builds browse and embed URLs for Plantsville", () => {
    const latitude = 5.5448458;
    const longitude = -0.2680674;

    expect(osmBrowseUrl(latitude, longitude)).toContain("openstreetmap.org");
    expect(osmBrowseUrl(latitude, longitude)).toContain(`mlat=${latitude}`);
    expect(osmBrowseUrl(latitude, longitude)).not.toMatch(/google|gmaps/i);

    const embed = osmEmbedUrl(latitude, longitude);
    expect(embed).toContain("/export/embed.html");
    expect(embed).toContain(`marker=${latitude},${longitude}`);
    expect(embed).not.toMatch(/google|gmaps/i);
  });

  it("rejects coordinates outside the valid range", () => {
    expect(() => osmBrowseUrl(95, 0)).toThrow(/latitude and longitude/);
    expect(() => osmEmbedUrl(0, 200)).toThrow(/latitude and longitude/);
  });
});
