// Cache keys for networthmonitor
export const CACHE_KEYS = {
  accountPrefix: "cache:account:",
  account: (id: string) => `cache:account:${id}` as const,
  buckets: "cache:buckets",
  dashboardFetched: "cache:dashboard-fetched",
  user: "cache:user",
  exchangeRates: "cache:exchange-rates",
  theme: "cache:theme",
} as const;

export const SESSION_TTL = () => Date.now() + 60 * 60 * 1000; // 1 hour
