import { cache } from "@broccoliapps/browser";
import { CACHE_KEYS, sessionStorage } from "./cache";

// Clear all networthmonitor caches (used for sign-out)
export const invalidateAll = () => {
  cache.removeByPrefix(CACHE_KEYS.accountPrefix, sessionStorage);
  cache.remove(CACHE_KEYS.buckets, sessionStorage);
  cache.remove(CACHE_KEYS.dashboardFetched, sessionStorage);
  cache.remove(CACHE_KEYS.user);
  cache.remove(CACHE_KEYS.exchangeRates);
};
