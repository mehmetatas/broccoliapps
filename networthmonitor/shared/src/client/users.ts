import type { AuthUserDto } from "@broccoliapps/shared";
import { getUser as getUserApi, type UserDto } from "../api-contracts";
import { CACHE_KEYS } from "./cache";
import { getCache } from "./init";

// Read-through cache: check cache → call API if miss → cache → return
export const getUser = async (): Promise<UserDto> => {
  const cached = getCache().get<UserDto>(CACHE_KEYS.user);
  if (cached) return cached;

  const { user } = await getUserApi.invoke({});
  getCache().set(CACHE_KEYS.user, user);
  return user;
};

// Sync version for components that can't use async (reads cache only)
export const getUserSync = (): UserDto | undefined => {
  return getCache().get<UserDto>(CACHE_KEYS.user) ?? undefined;
};

// Called by AuthCallback to populate cache after login
export const setUserFromAuth = (user: AuthUserDto): void => {
  getCache().set(CACHE_KEYS.user, user);
};
