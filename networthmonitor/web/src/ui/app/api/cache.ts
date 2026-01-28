// Cache keys for networthmonitor
export const CACHE_KEYS = {
  accountPrefix: "cache:account:",
  account: (id: string) => `cache:account:${id}` as const,
  buckets: "cache:buckets",
  dashboardFetched: "cache:dashboard-fetched",
  user: "cache:user",
  exchangeRates: "cache:exchange-rates",
  theme: "cache:theme",
  accessToken: "cache:accessToken",
  refreshToken: "cache:refreshToken",
} as const;

export const sessionStorage = { storage: "session" } as const;
