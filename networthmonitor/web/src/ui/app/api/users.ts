import { cache } from "@broccoliapps/browser";
import {
  getUser as getUserApi,
  patchUser as patchUserApi,
  type AuthUserDto,
} from "../../../shared/api-contracts";
import { CACHE_KEYS, sessionStorage } from "./cache";

// Read-through cache: check cache → call API if miss → cache → return
export const getUser = async (): Promise<AuthUserDto> => {
  const cached = cache.get<AuthUserDto>(CACHE_KEYS.user);
  if (cached) return cached;

  const { user } = await getUserApi.invoke({});
  // API returns UserDto, but we store as AuthUserDto format
  const authUser: AuthUserDto = {
    ...user,
    isNewUser: false,
    targetCurrency: user.targetCurrency || null,
  };
  cache.set(CACHE_KEYS.user, authUser);
  return authUser;
};

// Sync version for components that can't use async (reads cache only)
export const getUserSync = (): AuthUserDto | undefined => {
  return cache.get<AuthUserDto>(CACHE_KEYS.user) ?? undefined;
};

// Update user: call API → update cache → return
export const patchUser = async (
  data: Parameters<typeof patchUserApi.invoke>[0]
): Promise<AuthUserDto> => {
  const { user } = await patchUserApi.invoke(data);
  const cached = cache.get<AuthUserDto>(CACHE_KEYS.user);
  // Merge the updated fields with the existing cached user
  const authUser: AuthUserDto = {
    id: user.id,
    email: user.email,
    name: user.name,
    targetCurrency: user.targetCurrency || null,
    isNewUser: cached?.isNewUser ?? false,
  };
  cache.set(CACHE_KEYS.user, authUser);
  return authUser;
};

// Called by AuthCallback to populate cache after login
export const setUserFromAuth = (user: AuthUserDto): void => {
  cache.set(CACHE_KEYS.user, user);
};

export const signOut = (): void => {
  // Clear all caches
  cache.removeByPrefix("cache:");
  cache.clear(sessionStorage);
  window.location.href = "/";
};
