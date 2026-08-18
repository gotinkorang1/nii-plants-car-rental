import "server-only";

/**
 * Small bounded TTL cache for provider responses.
 *
 * Autocomplete re-sends the same prefixes constantly, and the provider's free
 * tier allows only 50 requests/day, so identical lookups must not each cost a
 * request. The cache is per server instance: on serverless this reduces quota
 * use rather than guaranteeing a single upstream call.
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type TtlCache<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  delete(key: string): void;
  clear(): void;
  readonly size: number;
};

export function createTtlCache<T>(options: {
  ttlMs: number;
  maxEntries: number;
}): TtlCache<T> {
  const entries = new Map<string, CacheEntry<T>>();

  function evictExpired(now: number) {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) {
        entries.delete(key);
      }
    }
  }

  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) {
        return undefined;
      }

      if (entry.expiresAt <= Date.now()) {
        entries.delete(key);
        return undefined;
      }

      // Refresh insertion order so hot keys survive eviction.
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key, value) {
      const now = Date.now();
      evictExpired(now);

      while (entries.size >= options.maxEntries) {
        const oldest = entries.keys().next();
        if (oldest.done) {
          break;
        }
        entries.delete(oldest.value);
      }

      entries.set(key, { value, expiresAt: now + options.ttlMs });
    },
    delete(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
  };
}
