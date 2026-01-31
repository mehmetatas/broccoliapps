export const CACHE_KEYS = {
  accountPrefix: "cache:account:",
  account: (id: string) => `cache:account:${id}` as const,
  buckets: "cache:buckets",
  dashboardFetched: "cache:dashboard-fetched",
  user: "cache:user",
  exchangeRates: "cache:exchange-rates",
  theme: "cache:theme",
} as const;

// Cache TTL: 1 hour in milliseconds
export const CACHE_TTL = 3600000;

export const getCacheExpiry = (): number => Date.now() + CACHE_TTL;
