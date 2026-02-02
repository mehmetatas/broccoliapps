import type { CacheProvider } from "@broccoliapps/shared";

type CacheValue<T> = {
  value: T;
  expiresAt?: number; // epoch ms
};

const set = <T>(key: string, value: T, expiresAt?: number): void => {
  const cacheValue: CacheValue<T> = { value, expiresAt };
  localStorage.setItem(key, JSON.stringify(cacheValue));
};

const get = <T>(key: string): T | null => {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    const cacheValue: CacheValue<T> = JSON.parse(raw);
    // Validate it has the expected structure
    if (typeof cacheValue !== "object" || cacheValue === null || !("value" in cacheValue)) {
      localStorage.removeItem(key);
      return null;
    }
    if (cacheValue.expiresAt && Date.now() > cacheValue.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return cacheValue.value;
  } catch {
    // Invalid JSON or unexpected format - remove corrupted entry
    localStorage.removeItem(key);
    return null;
  }
};

const remove = (key: string): void => {
  localStorage.removeItem(key);
};

const removeByPrefix = (prefix: string): void => {
  const keysToRemove = keys(prefix);
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
};

const keys = (prefix: string): string[] => {
  const result: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      result.push(key);
    }
  }
  return result;
};

const clear = (): void => {
  localStorage.clear();
};

export const cache: CacheProvider = { set, get, remove, removeByPrefix, keys, clear };
