import type { CacheProvider } from "@broccoliapps/shared";

let cacheProvider: CacheProvider;

export function initClient(provider: CacheProvider) {
  cacheProvider = provider;
}

export function getCache(): CacheProvider {
  if (!cacheProvider) throw new Error("Client not initialized. Call initClient() first.");
  return cacheProvider;
}
