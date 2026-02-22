// lib/rate-limit.ts
// Simple in-memory rate limiter for API routes

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Every minute

export interface RateLimitConfig {
  limit: number // Max requests
  windowMs: number // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp
}

// Default rate limits for different operations
export const RATE_LIMITS = {
  // Standard API endpoints
  default: { limit: 100, windowMs: 60 * 1000 }, // 100 per minute

  // Auth-related endpoints
  auth: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute

  // AI endpoints (expensive operations)
  ai: { limit: 20, windowMs: 60 * 1000 }, // 20 per minute

  // Webhook endpoints
  webhook: { limit: 200, windowMs: 60 * 1000 }, // 200 per minute

  // File upload
  upload: { limit: 10, windowMs: 60 * 1000 }, // 10 per minute

  // Search/query endpoints
  search: { limit: 60, windowMs: 60 * 1000 }, // 60 per minute

  // Bulk operations
  bulk: { limit: 5, windowMs: 60 * 1000 }, // 5 per minute
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMITS.default
): RateLimitResult {
  const now = Date.now()
  const key = identifier
  const entry = rateLimitStore.get(key)

  // If no entry or entry has expired, create new one
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: Math.ceil((now + config.windowMs) / 1000),
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: Math.ceil(entry.resetAt / 1000),
    }
  }

  // Increment counter
  entry.count++

  return {
    success: true,
    limit: config.limit,
    remaining: config.limit - entry.count,
    reset: Math.ceil(entry.resetAt / 1000),
  }
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  }
}

/**
 * Get identifier from request (IP + user ID if available)
 */
export function getIdentifier(
  request: Request,
  userId?: string
): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0] || 'unknown'
  return userId ? `${ip}:${userId}` : ip
}

/**
 * Rate limit middleware helper
 */
export function withRateLimit<T>(
  identifier: string,
  config: RateLimitConfig,
  fn: () => Promise<T>
): Promise<T> {
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    const error = new Error('Too many requests') as Error & { status: number }
    error.status = 429
    throw error
  }

  return fn()
}
