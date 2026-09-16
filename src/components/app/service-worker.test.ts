import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { registerServiceWorker } from "@/lib/pwa/register-service-worker";

const workerSource = readFileSync(path.resolve(process.cwd(), "public/sw.js"), "utf8");
const offlinePage = readFileSync(
  path.resolve(process.cwd(), "public/offline.html"),
  "utf8",
);

describe("service worker registration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Reflect.deleteProperty(navigator, "serviceWorker");
  });

  it("resolves without registering when service workers are unsupported", async () => {
    Reflect.deleteProperty(navigator, "serviceWorker");

    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });

  it("resolves safely for synchronous and rejected registration failures", async () => {
    const register = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("sync failure");
      })
      .mockRejectedValueOnce(new Error("async failure"));
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: { register },
    });

    await expect(registerServiceWorker()).resolves.toBeUndefined();
    await expect(registerServiceWorker()).resolves.toBeUndefined();
    expect(register).toHaveBeenCalledTimes(2);
  });
});

describe("safe offline worker", () => {
  it("keeps the precache allowlist limited to the offline shell assets", () => {
    for (const asset of [
      "/",
      "/offline.html",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/brand/nii-plants-logo.png",
    ]) {
      expect(workerSource).toContain(`"${asset}"`);
    }

    expect(workerSource).toContain('"nii-plants-shell-v1"');
    expect(workerSource).not.toContain("cache.put(");
    expect(workerSource).not.toContain("/api/");
    expect(workerSource).not.toContain("/admin");
    expect(workerSource).not.toContain("payment");
  });

  it("passes through non-navigation requests and falls back only for navigation", () => {
    expect(workerSource).toContain('request.mode !== "navigate"');
    expect(workerSource).toContain("fetch(request)");
    expect(workerSource).toContain('caches.match("/offline.html")');
    expect(workerSource).toContain('name.startsWith("nii-plants-shell-")');
    expect(workerSource).toContain("clients.claim()");
  });
});

describe("offline page", () => {
  it("provides branded retry and home affordances without success language", () => {
    expect(offlinePage).toContain("Connection unavailable");
    expect(offlinePage).toContain('href="/"');
    expect(offlinePage).toContain("Try again");
    expect(offlinePage).toContain("nii-plants-logo.png");
    expect(offlinePage.toLowerCase()).not.toMatch(/booking|payment|success|confirmed/);
  });
});
