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
  if (!raw) return null;

  const cacheValue: CacheValue<T> = JSON.parse(raw);
  if (cacheValue.expiresAt && Date.now() > cacheValue.expiresAt) {
    localStorage.removeItem(key);
    return null;
  }
  return cacheValue.value;
};

const remove = (key: string): void => {
  localStorage.removeItem(key);
};

export const cache = { set, get, remove };
