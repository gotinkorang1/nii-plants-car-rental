import { describe, expect, it } from "vitest";

import { asOptionalString, publicEnvSchema } from "@/lib/env";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and later Tailwind utilities win", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("asOptionalString", () => {
  it("treats empty foundation values as unset", () => {
    expect(asOptionalString("")).toBeUndefined();
    expect(asOptionalString("   ")).toBeUndefined();
    expect(asOptionalString(undefined)).toBeUndefined();
  });
});

describe("publicEnvSchema", () => {
  it("allows missing public configuration during foundation builds", () => {
    const parsed = publicEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: undefined,
      NEXT_PUBLIC_SUPABASE_URL: undefined,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    });

    expect(parsed.NEXT_PUBLIC_APP_URL).toBeUndefined();
    expect(parsed.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
    expect(parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeUndefined();
  });

  it("accepts a valid public app URL", () => {
    const parsed = publicEnvSchema.parse({
      NEXT_PUBLIC_APP_URL: "https://niiplantsghana.com",
    });

    expect(parsed.NEXT_PUBLIC_APP_URL).toBe("https://niiplantsghana.com");
  });
});
