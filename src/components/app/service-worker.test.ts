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
    const precacheBlock = workerSource.match(
      /const PRECACHE_URLS = \[([\s\S]*?)\];/,
    )?.[1];
    const precacheEntries = precacheBlock
      ? [...precacheBlock.matchAll(/^\s*"([^"]+)",?$/gm)].map(
          ([, asset]) => asset,
        )
      : [];

    expect(precacheEntries).toEqual([
      "/",
      "/offline.html",
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/brand/nii-plants-logo.png",
    ]);

    expect(workerSource).toContain('"nii-plants-shell-v1"');
  });

  it("uses only the current shell cache for navigation fallbacks", () => {
    expect(workerSource).toContain("caches.open(CACHE_NAME)");
    expect(workerSource).toMatch(/cache\s*\.match\(request\)/);
    expect(workerSource).toMatch(/cache\s*\.match\("\/offline\.html"\)/);
    expect(workerSource).not.toContain("caches.match(request)");
  });

  it("deletes only older Nii Plants shell caches during activation", () => {
    const activateHandler = workerSource.match(
      /self\.addEventListener\("activate", \(event\) => \{([\s\S]*?)\n\}\);/,
    )?.[1];

    expect(activateHandler).toBeDefined();
    expect(activateHandler).toContain(
      'name.startsWith("nii-plants-shell-") && name !== CACHE_NAME',
    );
    expect(activateHandler).toContain("caches.delete(name)");
    expect(activateHandler).not.toContain("caches.delete(CACHE_NAME)");
  });

  it("passes through API, admin, payment, and customer requests without caching", () => {
    const fetchHandler = workerSource.match(
      /self\.addEventListener\("fetch", \(event\) => \{([\s\S]*?)\n\}\);/,
    )?.[1];

    expect(fetchHandler).toBeDefined();
    if (fetchHandler === undefined) {
      throw new Error("fetch handler not found in service worker source");
    }
    expect(fetchHandler).toContain('request.mode !== "navigate"');
    expect(fetchHandler).toMatch(
      /if \(request\.mode !== "navigate"\) \{\s*return;\s*\}/,
    );
    expect(fetchHandler).toContain("fetch(request)");
    const nonNavigationBranch = fetchHandler.match(
      /if \(request\.mode !== "navigate"\) \{([\s\S]*?)\}/,
    )?.[1];
    expect(nonNavigationBranch).toBe("\n    return;\n  ");
    expect(nonNavigationBranch).not.toMatch(/cache|caches|respondWith/);
    expect(fetchHandler).not.toContain("cache.put");
    expect(fetchHandler).not.toContain("cache.add");
    expect(workerSource).not.toMatch(/request\.url.*(?:\/api\/|\/admin|payment|customer)/);
    expect(workerSource).toContain('request.mode !== "navigate"');
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
