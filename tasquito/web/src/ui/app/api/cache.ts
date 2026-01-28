// Cache keys for tasquito
export const CACHE_KEYS = {
  taskPrefix: "cache:task:",
  task: (id: string) => `cache:task:${id}` as const,
  tasksFetched: "cache:tasks-fetched",
  user: "cache:user",
  accessToken: "cache:accessToken",
  refreshToken: "cache:refreshToken",
} as const;

export const sessionStorage = { storage: "session" } as const;
