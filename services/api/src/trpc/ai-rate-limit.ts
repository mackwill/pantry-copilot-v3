/**
 * Fixed-window per-user limiter for AI generation/scan procedures. In-memory
 * (single API instance for launch); swap for Redis if we scale horizontally.
 */
interface Bucket {
  count: number;
  windowStart: number;
}
const buckets = new Map<string, Bucket>();

export function consumeAiActionSlot(
  userId: string,
  max: number,
  windowMs: number,
  now: number,
): boolean {
  const b = buckets.get(userId);
  if (b === undefined || now - b.windowStart >= windowMs) {
    buckets.set(userId, { count: 1, windowStart: now });
    return true;
  }
  if (b.count >= max) return false;
  b.count += 1;
  return true;
}

/** Test-only: clear all buckets between cases. */
export function __resetAiRateLimiter(): void {
  buckets.clear();
}
