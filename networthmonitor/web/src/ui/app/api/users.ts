import { cache } from "@broccoliapps/browser";
import {
  getUser as getUserApi,
  type UserDto,
} from "../../../shared/api-contracts";
import { CACHE_KEYS } from "./cache";

// Read-through cache: check cache → call API if miss → cache → return
export const getUser = async (): Promise<UserDto> => {
  const cached = cache.get<UserDto>(CACHE_KEYS.user);
  if (cached) return cached;

  const { user } = await getUserApi.invoke({});
  cache.set(CACHE_KEYS.user, user);
  return user;
};

// Sync version for components that can't use async (reads cache only)
export const getUserSync = (): UserDto | undefined => {
  return cache.get<UserDto>(CACHE_KEYS.user) ?? undefined;
};

export const signOut = (): void => {
  // Clear all caches
  cache.removeByPrefix("cache:");
  window.location.href = "/";
};
