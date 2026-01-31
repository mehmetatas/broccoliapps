import { CACHE_KEYS } from "./cache";
import { getCache } from "./init";

// Clear all networthmonitor caches
export const invalidateAll = () => {
  getCache().removeByPrefix(CACHE_KEYS.accountPrefix);
  getCache().remove(CACHE_KEYS.buckets);
  getCache().remove(CACHE_KEYS.dashboardFetched);
  getCache().remove(CACHE_KEYS.user);
  getCache().remove(CACHE_KEYS.exchangeRates);
};
