import type { AuthUserDto } from "@broccoliapps/shared";
import { CACHE_KEYS } from "./cache";
import { getCache } from "./init";

// Sync version for components that can't use async (reads cache only)
export const getUserSync = (): AuthUserDto | undefined => {
  return getCache().get<AuthUserDto>(CACHE_KEYS.user) ?? undefined;
};

// Called by AuthCallback to populate cache after login
export const setUserFromAuth = (user: AuthUserDto): void => {
  getCache().set(CACHE_KEYS.user, user);
};
