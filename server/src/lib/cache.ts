import Redis from 'ioredis'

// In-Memory Fallback Cache Store with Maximum Size Limit (LRU Protection)
interface MemoryCacheEntry {
  value: any
  expiresAt: number
}

const MAX_MEMORY_CACHE_ITEMS = 1500
const memoryStore = new Map<string, MemoryCacheEntry>()

// Periodic cleanup of expired memory entries every 2 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of memoryStore.entries()) {
    if (entry.expiresAt <= now) {
      memoryStore.delete(key)
    }
  }
}, 2 * 60 * 1000)

let redisClient: Redis | null = null
let redisAvailable = false

const redisUrl = process.env.REDIS_URL?.trim()

if (redisUrl) {
  try {
    const isTls = redisUrl.startsWith('rediss://') || redisUrl.includes('upstash') || redisUrl.includes('render.com')
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 5000,
      lazyConnect: false,
      tls: isTls ? { rejectUnauthorized: false } : undefined,
      retryStrategy(times) {
        if (times > 5) {
          console.warn('[Cache] Redis max connection retries reached. Using memory fallback.')
          return null // Stop retrying indefinitely
        }
        return Math.min(times * 1000, 3000)
      },
    })

    redisClient.on('connect', () => {
      redisAvailable = true
      console.log('⚡ [Cache] Redis connected successfully.')
    })

    redisClient.on('error', (err) => {
      redisAvailable = false
      console.warn('[Cache] Redis connection warning (operating in memory fallback mode):', err.message)
    })

    redisClient.on('close', () => {
      redisAvailable = false
    })
  } catch (err) {
    console.warn('[Cache] Failed to initialize Redis client, falling back to memory:', err)
    redisClient = null
    redisAvailable = false
  }
} else {
  console.log('ℹ️  [Cache] No REDIS_URL provided. Operating in high-performance in-memory cache mode.')
}

/**
 * Get an item from Redis or in-memory fallback cache.
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (redisAvailable && redisClient) {
    try {
      const data = await redisClient.get(key)
      if (data) {
        try {
          return JSON.parse(data) as T
        } catch {
          return null
        }
      }
      return null
    } catch (err) {
      console.warn(`[Cache] Redis GET failed for "${key}", falling back to memory:`, err)
    }
  }

  // Memory fallback
  const entry = memoryStore.get(key)
  if (!entry) return null

  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key)
    return null
  }

  return entry.value as T
}

/**
 * Set an item in Redis or in-memory fallback cache with TTL (seconds).
 */
export const cacheSet = async <T>(key: string, value: T, ttlSeconds = 60): Promise<void> => {
  if (redisAvailable && redisClient) {
    try {
      const serialized = JSON.stringify(value)
      if (ttlSeconds > 0) {
        await redisClient.setex(key, ttlSeconds, serialized)
      } else {
        await redisClient.set(key, serialized)
      }
      return
    } catch (err) {
      console.warn(`[Cache] Redis SET failed for "${key}", saving to memory:`, err)
    }
  }

  // Memory fallback with LRU eviction protection
  if (memoryStore.size >= MAX_MEMORY_CACHE_ITEMS) {
    const oldestKey = memoryStore.keys().next().value
    if (oldestKey) {
      memoryStore.delete(oldestKey)
    }
  }

  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

/**
 * Delete a specific key from cache.
 */
export const cacheDel = async (key: string): Promise<void> => {
  if (redisAvailable && redisClient) {
    try {
      await redisClient.del(key)
    } catch (err) {
      console.warn(`[Cache] Redis DEL failed for "${key}":`, err)
    }
  }

  memoryStore.delete(key)
}

/**
 * Delete all keys matching a prefix/pattern.
 */
export const cacheDelPattern = async (pattern: string): Promise<void> => {
  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(...keys)
      }
    } catch (err) {
      console.warn(`[Cache] Redis DEL pattern failed for "${pattern}":`, err)
    }
  }

  const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
  for (const key of memoryStore.keys()) {
    if (regex.test(key)) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Check if Redis is actively connected.
 */
export const isRedisActive = (): boolean => redisAvailable
