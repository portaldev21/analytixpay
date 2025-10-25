import crypto from "crypto";
import type { TPdfParseResult } from "@/db/types";
import { logger } from "@/lib/logger";

/**
 * Cache entry interface
 */
interface CacheEntry {
  hash: string;
  result: TPdfParseResult;
  timestamp: number;
}

/**
 * In-memory cache for PDF parse results
 * For production, consider using Redis or similar
 */
const cache = new Map<string, CacheEntry>();

/**
 * Cache time-to-live (24 hours)
 */
const CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Maximum cache size (prevent memory issues)
 */
const MAX_CACHE_SIZE = 100;

/**
 * Generate SHA-256 hash from file buffer
 * @param buffer - File ArrayBuffer
 * @returns Hexadecimal hash string
 */
export function generateFileHash(buffer: ArrayBuffer): string {
  const hashSum = crypto.createHash("sha256");
  hashSum.update(Buffer.from(buffer));
  return hashSum.digest("hex");
}

/**
 * Get cached parse result by hash
 * @param hash - File hash
 * @returns Cached result or null if not found/expired
 */
export function getCachedResult(hash: string): TPdfParseResult | null {
  const entry = cache.get(hash);

  if (!entry) {
    logger.debug("Cache miss", { hash });
    return null;
  }

  // Check if expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(hash);
    logger.debug("Cache expired", { hash, age: Date.now() - entry.timestamp });
    return null;
  }

  logger.info("Cache hit", {
    hash,
    age: Date.now() - entry.timestamp,
    transactionCount: entry.result.transactions.length,
  });

  return entry.result;
}

/**
 * Cache a parse result
 * @param hash - File hash
 * @param result - Parse result to cache
 */
export function cacheResult(hash: string, result: TPdfParseResult): void {
  // Check cache size limit
  if (cache.size >= MAX_CACHE_SIZE) {
    // Evict oldest entry
    const oldest = Array.from(cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    )[0];

    if (oldest) {
      cache.delete(oldest[0]);
      logger.debug("Cache eviction", {
        evictedHash: oldest[0],
        cacheSize: cache.size,
      });
    }
  }

  cache.set(hash, {
    hash,
    result,
    timestamp: Date.now(),
  });

  logger.info("Result cached", {
    hash,
    transactionCount: result.transactions.length,
    cacheSize: cache.size,
  });
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  const size = cache.size;
  cache.clear();
  logger.info("Cache cleared", { entriesRemoved: size });
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: { hash: string; age: number; transactionCount: number }[];
} {
  const entries = Array.from(cache.entries()).map(([hash, entry]) => ({
    hash,
    age: Date.now() - entry.timestamp,
    transactionCount: entry.result.transactions.length,
  }));

  return {
    size: cache.size,
    entries,
  };
}

/**
 * Remove expired entries from cache
 * Call periodically to free memory
 */
export function cleanExpiredEntries(): number {
  const now = Date.now();
  let removed = 0;

  for (const [hash, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(hash);
      removed++;
    }
  }

  if (removed > 0) {
    logger.info("Expired cache entries cleaned", {
      removed,
      remaining: cache.size,
    });
  }

  return removed;
}
