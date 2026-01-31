import * as v from "valibot";

// ============================================================================
// Auth User DTO
// ============================================================================
export const authUserDto = {
  id: v.string(),
  email: v.string(),
  name: v.string(),
  isNewUser: v.boolean(),
};
export type AuthUserDto = v.InferOutput<v.ObjectSchema<typeof authUserDto, undefined>>;

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

// ============================================================================
// POST /auth/send-magic-link - send magic link email
// ============================================================================
export const sendMagicLinkRequest = {
  email: v.pipe(v.string(), v.email()),
  platform: v.optional(v.picklist(["mobile"])),
};
export type SendMagicLinkRequest = v.InferOutput<v.ObjectSchema<typeof sendMagicLinkRequest, undefined>>;

export const sendMagicLinkResponse = {
  success: v.boolean(),
};
export type SendMagicLinkResponse = v.InferOutput<v.ObjectSchema<typeof sendMagicLinkResponse, undefined>>;

// ============================================================================
// POST /auth/verify-apple - verify Apple Sign In identity token
// ============================================================================
export const verifyAppleRequest = {
  identityToken: v.string(),
  authorizationCode: v.string(),
  user: v.string(),
  fullName: v.optional(v.object({
    givenName: v.optional(v.nullable(v.string())),
    familyName: v.optional(v.nullable(v.string())),
  })),
};
export type VerifyAppleRequest = v.InferOutput<v.ObjectSchema<typeof verifyAppleRequest, undefined>>;

export const verifyAppleResponse = {
  ...authExchangeResponse,
};
export type VerifyAppleResponse = v.InferOutput<v.ObjectSchema<typeof verifyAppleResponse, undefined>>;
