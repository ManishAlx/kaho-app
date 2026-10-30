/**
 * Simple in-memory sliding-window rate limiter.
 * Fine for a single server process. For multiple instances / serverless,
 * swap the body of `hit` for Upstash Redis (@upstash/ratelimit) - same signature.
 */
const store = new Map<string, number[]>();

export function hit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const arr = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    store.set(key, arr);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - arr[0])) / 1000)) };
  }
  arr.push(now);
  store.set(key, arr);
  if (store.size > 50_000) {
    for (const [k, v] of store) if (!v.some((t) => now - t < windowMs)) store.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}
