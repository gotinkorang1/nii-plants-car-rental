import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readSource(relativePath: string) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

describe("public fleet data access", () => {
  it("never queries physical vehicles in public catalogue modules", () => {
    const files = [
      "src/lib/fleet/get-public-models.ts",
      "src/lib/fleet/get-public-model.ts",
      "src/lib/fleet/get-featured-models.ts",
      "src/lib/fleet/get-related-models.ts",
      "src/lib/fleet/map-public-model.ts",
    ];

    for (const file of files) {
      const source = readSource(file);
      expect(source, file).not.toMatch(/\bvehicles\b/);
      expect(source, file).not.toContain("registrationNumber");
      expect(source, file).not.toContain("internalCode");
      expect(source, file).not.toContain("internal_code");
    }
  });
});

describe("phase 2 RLS and storage SQL", () => {
  it("does not grant anonymous SELECT on physical vehicles", () => {
    const phase1 = readSource("drizzle/0001_phase1_rls_auth.sql");
    const phase2 = readSource("drizzle/0002_phase2_public_catalogue_storage.sql");

    expect(phase1).toMatch(/REVOKE ALL ON TABLE public\.vehicles FROM PUBLIC, anon/);
    expect(phase2).toMatch(/REVOKE ALL ON TABLE public\.vehicles FROM PUBLIC, anon/);
    expect(phase2).not.toMatch(/GRANT SELECT ON TABLE public\.vehicles TO anon/);
    expect(phase2).not.toMatch(
      /GRANT SELECT ON public\.public_vehicle_catalogue TO anon/,
    );
  });

  it("creates a public catalogue view without internal vehicle columns", () => {
    const phase2 = readSource("drizzle/0002_phase2_public_catalogue_storage.sql");

    expect(phase2).toContain("CREATE OR REPLACE VIEW public.public_vehicle_catalogue");
    expect(phase2).not.toContain("registration_number");
    expect(phase2).not.toContain("internal_code");
    expect(phase2).not.toContain("current_mileage");
    expect(phase2).toContain("fleet-media");
    expect(phase2).toContain("WHERE vm.published = true");
    expect(phase2).toContain("vc.active = true");
  });
});

describe("phase 12 shop rates and OSM", () => {
  it("adds USD catalogue columns and keeps the public view off anon", () => {
    const phase12 = readSource("drizzle/0011_phase12_shop_rates_osm.sql");

    expect(phase12).toContain("usd_daily_rate_from");
    expect(phase12).toContain("CREATE OR REPLACE VIEW public.public_vehicle_catalogue");
    expect(phase12).not.toContain("registration_number");
    expect(phase12).not.toMatch(
      /GRANT SELECT ON public\.public_vehicle_catalogue TO anon/,
    );
  });

  it("keeps production catalogue upsert free of physical vehicles", () => {
    const script = readSource("scripts/upsert-production-catalog.mjs");
    const helper = readSource("scripts/lib/upsert-catalog.mjs");

    expect(script).toContain("upsertLocationsClassesAndModels");
    expect(script).not.toMatch(/INSERT INTO vehicles/);
    expect(helper).not.toMatch(/INSERT INTO vehicles/);
    expect(helper).not.toMatch(/INSERT INTO promotions/);
  });
});
