import type { AuthExchangeResponse, AuthUserDto } from "@broccoliapps/shared";
import { cache } from "./cache";

export const AUTH_CACHE_KEYS = {
  accessToken: "cache:accessToken",
  refreshToken: "cache:refreshToken",
  user: "cache:user",
} as const;

export const setAuthTokens = (response: AuthExchangeResponse): void => {
  cache.set(AUTH_CACHE_KEYS.accessToken, response.accessToken, response.accessTokenExpiresAt);
  cache.set(AUTH_CACHE_KEYS.refreshToken, response.refreshToken, response.refreshTokenExpiresAt);
  cache.set(AUTH_CACHE_KEYS.user, response.user);
};

export const setAuthUser = (user: AuthUserDto): void => {
  cache.set(AUTH_CACHE_KEYS.user, user);
};

export const getAuthUser = (): AuthUserDto | null => {
  return cache.get<AuthUserDto>(AUTH_CACHE_KEYS.user);
};

export const clearAuth = (): void => {
  cache.remove(AUTH_CACHE_KEYS.accessToken);
  cache.remove(AUTH_CACHE_KEYS.refreshToken);
  cache.remove(AUTH_CACHE_KEYS.user);
};

export const signOut = (): void => {
  cache.removeByPrefix("cache:");
  window.location.href = "/";
};
