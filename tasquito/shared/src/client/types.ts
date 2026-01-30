export type CacheProvider = {
  set<T>(key: string, value: T, expiresAt?: number): void;
  get<T>(key: string): T | null;
  remove(key: string): void;
  removeByPrefix(prefix: string): void;
  keys(prefix: string): string[];
  clear(): void;
};
