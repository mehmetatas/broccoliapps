import type { CacheProvider } from "@broccoliapps/shared";

let cacheProvider: CacheProvider;

export const initClient = (provider: CacheProvider) => {
  cacheProvider = provider;
};

export const getCache = (): CacheProvider => {
  if (!cacheProvider) {
    throw new Error("Client not initialized. Call initClient() first.");
  }
  return cacheProvider;
};
