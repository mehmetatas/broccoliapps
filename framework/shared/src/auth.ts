import {
  authExchangeRequest,
  authExchangeResponse,
  refreshTokenRequest,
  refreshTokenResponse,
  sendMagicLinkRequest,
  sendMagicLinkResponse,
  verifyAppleRequest,
  verifyAppleResponse,
} from "./auth.dto";
import { api } from "./contract";

// POST /auth/exchange - exchange code for tokens
export const authExchange = api("POST", "/auth/exchange").withRequest(authExchangeRequest).withResponse(authExchangeResponse);

// POST /auth/refresh - refresh tokens
export const refreshToken = api("POST", "/auth/refresh").withRequest(refreshTokenRequest).withResponse(refreshTokenResponse);

// POST /auth/send-magic-link - send magic link email
export const sendMagicLink = api("POST", "/auth/send-magic-link").withRequest(sendMagicLinkRequest).withResponse(sendMagicLinkResponse);

// POST /auth/verify-apple - verify Apple Sign In identity token
export const verifyApple = api("POST", "/auth/verify-apple").withRequest(verifyAppleRequest).withResponse(verifyAppleResponse);
