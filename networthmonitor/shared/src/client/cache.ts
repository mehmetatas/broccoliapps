import { COMMON_CACHE_KEYS } from "@broccoliapps/shared";

export { CACHE_TTL, getCacheExpiry } from "@broccoliapps/shared";

export const CACHE_KEYS = {
  ...COMMON_CACHE_KEYS,

  accountPrefix: "cache:account:",
  account: (id: string) => `cache:account:${id}` as const,
  buckets: "cache:buckets",
  dashboardFetched: "cache:dashboard-fetched",
  exchangeRates: "cache:exchange-rates",
} as const;
