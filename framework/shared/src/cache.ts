import type { CacheProvider } from "./types";

export const CACHE_TTL = 3600000; // 1 hour in milliseconds

export const getCacheExpiry = (): number => Date.now() + CACHE_TTL;

/**
 * Query with cache-aside pattern: return cached value if present,
 * otherwise fetch, cache, and return.
 */
export const cachedQuery = async <T>(cache: CacheProvider, key: string, fetchFn: () => Promise<T>): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  const result = await fetchFn();
  cache.set(key, result, getCacheExpiry());
  return result;
};
