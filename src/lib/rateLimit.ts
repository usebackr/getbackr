/**
 * A basic, lightweight, in-memory rate limiter.
 * This is suitable for a single-instance Node.js deployment (like most basic Vercel serverless functions).
 * For multi-instance horizontal scaling, consider migrating to Upstash Redis or Vercel KV.
 */

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitInfo>();

export function rateLimit(identifier: string, limit: number, windowMs: number): { success: boolean; limit: number; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store.get(identifier);

  // If entry exists and is not expired
  if (record && record.resetAt > now) {
    record.count += 1;
    
    // Cleanup old keys occasionally to prevent memory leaks in long-running processes
    if (store.size > 10000) {
      for (const [key, val] of store.entries()) {
        if (val.resetAt < now) store.delete(key);
      }
    }

    return {
      success: record.count <= limit,
      limit,
      remaining: Math.max(0, limit - record.count),
      resetAt: record.resetAt
    };
  }

  // Create or overwrite entry
  const resetAt = now + windowMs;
  store.set(identifier, { count: 1, resetAt });

  return {
    success: true,
    limit,
    remaining: limit - 1,
    resetAt
  };
}
