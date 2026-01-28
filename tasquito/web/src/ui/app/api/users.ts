import { cache } from "@broccoliapps/browser";
import type { AuthUserDto } from "@broccoliapps/tasquito-shared";
import { CACHE_KEYS } from "./cache";

// Sync version for components that can't use async (reads cache only)
export const getUserSync = (): AuthUserDto | undefined => {
  return cache.get<AuthUserDto>(CACHE_KEYS.user) ?? undefined;
};

// Called by AuthCallback to populate cache after login
export const setUserFromAuth = (user: AuthUserDto): void => {
  cache.set(CACHE_KEYS.user, user);
};

export const signOut = (): void => {
  // Clear all caches
  cache.removeByPrefix("cache:");
  window.location.href = "/";
};
