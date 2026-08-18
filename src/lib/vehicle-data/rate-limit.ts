import "server-only";

/**
 * Fixed-window limiter for the staff-facing vehicle data endpoints.
 *
 * Debouncing already throttles a well-behaved browser; this guards against a
 * stuck key-repeat or an open tab burning the provider's daily quota. It is
 * per server instance, which is enough for that purpose.
 */

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type Window = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}) {
  const maxKeys = options.maxKeys ?? 500;
  const windows = new Map<string, Window>();

  return function consume(key: string): RateLimitResult {
    const now = Date.now();

    for (const [existingKey, window] of windows) {
      if (window.resetAt <= now) {
        windows.delete(existingKey);
      }
    }

    if (windows.size >= maxKeys && !windows.has(key)) {
      windows.clear();
    }

    const current = windows.get(key);
    if (!current || current.resetAt <= now) {
      const resetAt = now + options.windowMs;
      windows.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: options.limit - 1, resetAt };
    }

    if (current.count >= options.limit) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count += 1;
    return {
      allowed: true,
      remaining: options.limit - current.count,
      resetAt: current.resetAt,
    };
  };
}

/** Autocomplete keystrokes are frequent, so the search window is generous. */
export const consumeVehicleDataSearchLimit = createRateLimiter({
  limit: 30,
  windowMs: 60_000,
});

/** Detail fetches are deliberate user actions and cost more provider requests. */
export const consumeVehicleDataFetchLimit = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
});

/** Image downloads run server-side and are the most expensive operation. */
export const consumeVehicleDataImportLimit = createRateLimiter({
  limit: 10,
  windowMs: 60_000,
});
