import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTtlCache } from "@/lib/vehicle-data/cache";
import { createRateLimiter } from "@/lib/vehicle-data/rate-limit";

describe("provider response cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a cached value until the TTL expires", () => {
    const cache = createTtlCache<string>({ ttlMs: 1000, maxEntries: 10 });
    cache.set("toyota", "corolla");

    expect(cache.get("toyota")).toBe("corolla");

    vi.advanceTimersByTime(1001);

    expect(cache.get("toyota")).toBeUndefined();
  });

  it("evicts the least recently used entry once full", () => {
    const cache = createTtlCache<number>({ ttlMs: 60_000, maxEntries: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    expect(cache.size).toBe(2);
  });
});

describe("provider rate limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows a burst up to the limit then refuses", () => {
    const consume = createRateLimiter({ limit: 3, windowMs: 60_000 });

    expect(consume("staff-1").allowed).toBe(true);
    expect(consume("staff-1").allowed).toBe(true);
    expect(consume("staff-1").remaining).toBe(0);
    expect(consume("staff-1").allowed).toBe(false);
  });

  it("keeps separate budgets per caller", () => {
    const consume = createRateLimiter({ limit: 1, windowMs: 60_000 });

    expect(consume("staff-1").allowed).toBe(true);
    expect(consume("staff-1").allowed).toBe(false);
    expect(consume("staff-2").allowed).toBe(true);
  });

  it("resets once the window rolls over", () => {
    const consume = createRateLimiter({ limit: 1, windowMs: 1000 });

    expect(consume("staff-1").allowed).toBe(true);
    expect(consume("staff-1").allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    expect(consume("staff-1").allowed).toBe(true);
  });
});
