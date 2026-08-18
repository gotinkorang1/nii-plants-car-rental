import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

describe("runtime environment", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.APP_ENV;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("prefers APP_ENV when set", async () => {
    process.env.APP_ENV = "preview";
    const { getRuntimeEnvironment } = await import("@/lib/env/runtime-environment");
    expect(getRuntimeEnvironment()).toBe("preview");
  });

  it("maps VERCEL_ENV production without APP_ENV", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    const { getRuntimeEnvironment, isProductionRuntime } = await import(
      "@/lib/env/runtime-environment"
    );
    expect(getRuntimeEnvironment()).toBe("production");
    expect(isProductionRuntime()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("treats local next start as development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    delete process.env.VERCEL_ENV;
    delete process.env.APP_ENV;
    const { getRuntimeEnvironment } = await import("@/lib/env/runtime-environment");
    expect(getRuntimeEnvironment()).toBe("development");
    vi.unstubAllEnvs();
  });
});

describe("paystack secret classification", () => {
  it("detects test and live prefixes", async () => {
    const { isPaystackTestSecret, isPaystackLiveSecret } = await import("@/lib/env/guards");
    expect(isPaystackTestSecret("sk_test_abc")).toBe(true);
    expect(isPaystackLiveSecret("sk_live_abc")).toBe(true);
    expect(isPaystackTestSecret("sk_live_abc")).toBe(false);
  });
});
