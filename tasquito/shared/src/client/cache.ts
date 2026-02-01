export { CACHE_TTL, getCacheExpiry } from "@broccoliapps/shared";

// Cache keys for tasquito
export const CACHE_KEYS = {
  // Projects
  projectPrefix: "cache:project:",
  project: (id: string) => `cache:project:${id}` as const,
  projectsFetched: "cache:projects-fetched",

  // Tasks (scoped by project)
  taskPrefix: (projectId: string) => `cache:task:${projectId}:` as const,
  task: (projectId: string, id: string) => `cache:task:${projectId}:${id}` as const,
  tasksFetched: (projectId: string) => `cache:tasks-fetched:${projectId}` as const,

  // Auth
  user: "cache:user",
  accessToken: "cache:accessToken",
  refreshToken: "cache:refreshToken",

  // Theme
  theme: "cache:theme",
} as const;
