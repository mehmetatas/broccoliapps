import { getUserPreferences, setUserPreference } from "@broccoliapps/shared";
import { cache } from "./cache";

const CACHE_KEY = "cache:preferences";

type PreferenceMap = Record<string, string | number | boolean>;

const getAll = async (): Promise<PreferenceMap> => {
  const cached = cache.get<PreferenceMap>(CACHE_KEY);
  if (cached) return cached;

  const { preferences } = await getUserPreferences.invoke();
  cache.set(CACHE_KEY, preferences);
  return preferences;
};

const getAllSync = (): PreferenceMap | null => {
  return cache.get<PreferenceMap>(CACHE_KEY);
};

const set = async (key: string, value: string | number | boolean): Promise<void> => {
  await setUserPreference.invoke({ key, value });

  // Update cache
  const current = cache.get<PreferenceMap>(CACHE_KEY) ?? {};
  current[key] = value;
  cache.set(CACHE_KEY, current);
};

export const preferences = { getAll, getAllSync, set };
