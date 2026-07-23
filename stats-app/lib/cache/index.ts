/**
 * lib/cache/index.ts
 *
 * Why it exists: Abstracts the caching backend behind a single interface.
 * - If Upstash Redis env vars are present: uses Redis (15-min TTL, shared across serverless instances).
 * - Otherwise: falls back to a module-level in-memory Map (per-instance, resets on cold start).
 *
 * This design lets the app work without Redis (local dev, simple deploys) while
 * being production-ready with Redis when configured.
 */

import { Redis } from "@upstash/redis";

// ─── TTL ──────────────────────────────────────────────────────────────────────

/** Cache TTL in seconds: 15 minutes */
export const CACHE_TTL_SECONDS = 900;

// ─── Cache interface ──────────────────────────────────────────────────────────

interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

// ─── Upstash Redis implementation ─────────────────────────────────────────────

class RedisCache implements Cache {
  private client: Redis;

  constructor(client: Redis) {
    this.client = client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.client.get<T>(key);
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, { ex: ttlSeconds });
    } catch {
      // Cache writes are non-fatal — log but don't throw
      console.warn(`[cache] Redis write failed for key: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {
      console.warn(`[cache] Redis delete failed for key: ${key}`);
    }
  }
}

// ─── In-memory fallback implementation ───────────────────────────────────────

interface MemEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache implements Cache {
  private store = new Map<string, MemEntry<unknown>>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

let _cache: Cache | null = null;

/**
 * Returns the appropriate cache implementation.
 * Singleton — created once per process.
 */
export function getCache(): Cache {
  if (_cache) return _cache;

  const url = process.env["UPSTASH_REDIS_REST_URL"];
  const token = process.env["UPSTASH_REDIS_REST_TOKEN"];

  if (url && token) {
    _cache = new RedisCache(new Redis({ url, token }));
  } else {
    _cache = new MemoryCache();
  }

  return _cache;
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Fetches from cache or calls `fetcher`, caches the result, and returns it.
 *
 * @param key   - Cache key (use cacheKey() from keys.ts)
 * @param fetcher - Async function that returns fresh data
 * @param ttl   - TTL in seconds (default: 15 minutes)
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL_SECONDS
): Promise<T> {
  const cache = getCache();
  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await cache.set(key, fresh, ttl);
  return fresh;
}
