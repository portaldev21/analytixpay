import { LRUCache } from 'lru-cache'
import { logger } from './logger'

/**
 * Rate limit configuration options
 */
export type RateLimitOptions = {
  /**
   * Time window in milliseconds
   */
  interval: number
  /**
   * Maximum number of unique tokens to track
   */
  uniqueTokenPerInterval: number
}

/**
 * Rate limiter implementation using LRU cache
 */
export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  })

  return {
    /**
     * Check if rate limit is exceeded
     * @param limit - Maximum allowed requests
     * @param token - Unique identifier (usually user ID)
     * @returns Promise that resolves if within limit, rejects if exceeded
     */
    check: (limit: number, token: string): Promise<void> =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = tokenCache.get(token) || [0]

        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount)
        }

        tokenCount[0] += 1

        const currentUsage = tokenCount[0]
        const isRateLimited = currentUsage > limit

        if (isRateLimited) {
          logger.warn('Rate limit exceeded', {
            token,
            limit,
            currentUsage,
            action: 'rate_limit_exceeded',
          })
          reject(
            new Error(
              `Rate limit exceeded. Maximum ${limit} requests allowed per ${options.interval / 1000}s`
            )
          )
        } else {
          logger.debug('Rate limit check passed', {
            token,
            limit,
            currentUsage,
            remaining: limit - currentUsage,
          })
          resolve()
        }
      }),

    /**
     * Get current usage for a token
     */
    getUsage: (token: string): number => {
      const tokenCount = tokenCache.get(token)
      return tokenCount ? tokenCount[0] : 0
    },

    /**
     * Reset limit for a token
     */
    reset: (token: string): void => {
      tokenCache.delete(token)
      logger.debug('Rate limit reset', { token })
    },
  }
}

/**
 * Rate limiter for invoice uploads
 * 5 uploads per 10 minutes per user
 */
export const uploadLimiter = rateLimit({
  interval: 10 * 60 * 1000, // 10 minutes
  uniqueTokenPerInterval: 500,
})

/**
 * Rate limiter for general API requests
 * 100 requests per minute per user
 */
export const apiLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 1000,
})

/**
 * Rate limiter for authentication attempts
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
})
