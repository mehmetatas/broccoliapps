import {setBaseUrl, setTokenProvider} from '@broccoliapps/shared';
import type {CacheProvider} from '@broccoliapps/shared';
import {initClient} from '@broccoliapps/tasquito-shared/client';
import {config} from '../config';

// In-memory cache for general data (projects, tasks, etc.)
// Tokens are stored separately in Keychain via auth/storage.ts
class MemoryCacheProvider implements CacheProvider {
  private store = new Map<string, {value: unknown; expiresAt?: number}>();

  set<T>(key: string, value: T, expiresAt?: number): void {
    this.store.set(key, {value, expiresAt});
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  removeByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  keys(prefix: string): string[] {
    return Array.from(this.store.keys()).filter(k => k.startsWith(prefix));
  }

  clear(): void {
    this.store.clear();
  }
}

let initialized = false;

export const initializeApiClient = (
  getAccessToken: () => Promise<string | undefined>,
) => {
  if (initialized) {
    return;
  }

  const cacheProvider = new MemoryCacheProvider();
  initClient(cacheProvider);
  setBaseUrl(config.apiBaseUrl);
  setTokenProvider({get: getAccessToken});
  initialized = true;
};
