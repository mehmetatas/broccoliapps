import * as v from "valibot";
import { authUserDto } from "./dto";

// ============================================================================
// POST /auth/exchange - exchange code for tokens
// ============================================================================
export const authExchangeRequest = {
  code: v.pipe(v.string(), v.maxLength(1024)),
};
export type AuthExchangeRequest = v.InferOutput<v.ObjectSchema<typeof authExchangeRequest, undefined>>;

export const authExchangeResponse = {
  accessToken: v.string(),
  accessTokenExpiresAt: v.number(),
  refreshToken: v.string(),
  refreshTokenExpiresAt: v.number(),
  user: v.object(authUserDto),
};
export type AuthExchangeResponse = v.InferOutput<v.ObjectSchema<typeof authExchangeResponse, undefined>>;

// ============================================================================
// POST /auth/refresh - refresh tokens
// ============================================================================
export const refreshTokenRequest = {
  refreshToken: v.pipe(v.string(), v.maxLength(1024)),
};
export type RefreshTokenRequest = v.InferOutput<v.ObjectSchema<typeof refreshTokenRequest, undefined>>;

export const refreshTokenResponse = {
  accessToken: v.string(),
  accessTokenExpiresAt: v.number(),
  refreshToken: v.string(),
  refreshTokenExpiresAt: v.number(),
};
export type RefreshTokenResponse = v.InferOutput<v.ObjectSchema<typeof refreshTokenResponse, undefined>>;
