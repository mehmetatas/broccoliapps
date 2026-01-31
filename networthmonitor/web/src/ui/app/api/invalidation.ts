import { cache } from "@broccoliapps/browser";
import { CACHE_KEYS } from "./cache";

// Clear all networthmonitor caches (used for sign-out)
export const invalidateAll = () => {
  cache.removeByPrefix(CACHE_KEYS.accountPrefix);
  cache.remove(CACHE_KEYS.buckets);
  cache.remove(CACHE_KEYS.dashboardFetched);
  cache.remove(CACHE_KEYS.user);
  cache.remove(CACHE_KEYS.exchangeRates);
};
