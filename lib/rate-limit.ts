// Simple in-memory rate limiter for development
// TODO: Replace with Redis for production

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

const store: RateLimitStore = {}

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60000, maxRequests: 10 }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const key = identifier
  const { windowMs, maxRequests } = options

  // Clean up old entries (simple cleanup)
  if (Object.keys(store).length > 10000) {
    Object.keys(store).forEach((k) => {
      if (store[k].resetAt < now) {
        delete store[k]
      }
    })
  }

  const record = store[key]

  if (!record || record.resetAt < now) {
    // Create new record or reset expired one
    store[key] = {
      count: 1,
      resetAt: now + windowMs,
    }
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: now + windowMs,
    }
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  }
}

// TODO: Implement Redis-based rate limiting for production
// Example: export async function rateLimitRedis(identifier: string, options: RateLimitOptions) { ... }

