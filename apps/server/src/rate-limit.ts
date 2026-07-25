/**
 * Simple in-memory sliding-window rate limits (P0.5).
 * Not multi-process safe — sufficient for single-realm beta.
 */

type Bucket = { timestamps: number[] };

const buckets = new Map<string, Bucket>();

/**
 * @returns true if allowed, false if limited
 */
export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  let b = buckets.get(key);
  if (!b) {
    b = { timestamps: [] };
    buckets.set(key, b);
  }
  b.timestamps = b.timestamps.filter((t) => now - t < windowMs);
  if (b.timestamps.length >= max) {
    return false;
  }
  b.timestamps.push(now);
  return true;
}

/** Test helper: clear all buckets. */
export function resetRateLimits(): void {
  buckets.clear();
}

export const LIMITS = {
  guest: { max: 20, windowMs: 60_000 },
  march: { max: 40, windowMs: 60_000 },
  chat: { max: 30, windowMs: 60_000 },
  admin: { max: 60, windowMs: 60_000 },
} as const;
