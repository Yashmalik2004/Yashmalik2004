/**
 * lib/cache/keys.ts
 *
 * Why it exists: Typed cache key builders ensure no key collisions and
 * make it easy to invalidate a specific card's cache. All cache reads/writes
 * must go through these functions — never hardcode strings.
 */

export type CardName = "overview" | "languages" | "stats" | "activity" | "streak";

/**
 * Returns the Redis cache key for a given card + username combination.
 * Format: `ghstats:v1:<card>:<username>`
 *
 * @example cacheKey("overview", "Yashmalik2004") → "ghstats:v1:overview:Yashmalik2004"
 */
export function cacheKey(card: CardName, username: string): string {
  return `ghstats:v2:${card}:${username.toLowerCase()}`;
}
