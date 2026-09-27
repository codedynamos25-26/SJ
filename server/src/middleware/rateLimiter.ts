import type { Request, Response, NextFunction } from 'express'

interface RateLimitRecord {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitRecord>()

// Automatically prune stale IP records every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of store.entries()) {
    if (record.resetTime <= now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimiterOptions {
  windowMs: number
  max: number
  message?: string
}

export const createRateLimiter = (options: RateLimiterOptions) => {
  const { windowMs, max, message = 'Too many requests from this IP, please try again later.' } = options

  return (req: Request, res: Response, next: NextFunction): void => {
    // Get client IP address
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown-ip'

    const key = `${req.baseUrl || ''}:${req.path}:${ip}`
    const now = Date.now()
    const record = store.get(key)

    if (!record || record.resetTime <= now) {
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      })
      res.setHeader('RateLimit-Limit', max)
      res.setHeader('RateLimit-Remaining', max - 1)
      res.setHeader('RateLimit-Reset', Math.ceil((now + windowMs) / 1000))
      return next()
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
      res.setHeader('Retry-After', retryAfterSeconds)
      res.setHeader('RateLimit-Limit', max)
      res.setHeader('RateLimit-Remaining', 0)
      res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000))
      res.status(429).json({
        error: message,
        retryAfterSeconds,
      })
      return
    }

    record.count += 1
    res.setHeader('RateLimit-Limit', max)
    res.setHeader('RateLimit-Remaining', Math.max(0, max - record.count))
    res.setHeader('RateLimit-Reset', Math.ceil(record.resetTime / 1000))
    next()
  }
}

// Strict limiter for authentication endpoints: max 20 requests per 15 minutes
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes for security protection.',
})

// General API limiter: max 400 requests per 10 minutes
export const generalApiLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 400,
  message: 'Too many requests. Please slow down and try again shortly.',
})
