import { COMMON_CACHE_KEYS } from "@broccoliapps/shared";

export { CACHE_TTL, getCacheExpiry } from "@broccoliapps/shared";

export const CACHE_KEYS = {
  ...COMMON_CACHE_KEYS,

  // Projects
  projectPrefix: "cache:project:",
  project: (id: string) => `cache:project:${id}` as const,
  projectsFetched: "cache:projects-fetched",

  // Tasks (scoped by project)
  taskPrefix: (projectId: string) => `cache:task:${projectId}:` as const,
  task: (projectId: string, id: string) => `cache:task:${projectId}:${id}` as const,
  tasksFetched: (projectId: string) => `cache:tasks-fetched:${projectId}` as const,
} as const;
