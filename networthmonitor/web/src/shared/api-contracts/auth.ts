import { api } from "@broccoliapps/shared";
import {
  authExchangeRequest,
  authExchangeResponse,
  refreshTokenRequest,
  refreshTokenResponse,
  sendMagicLinkRequest,
  sendMagicLinkResponse,
} from "./auth.dto";

// POST /auth/exchange - exchange code for tokens
export const authExchange = api("POST", "/auth/exchange")
  .withRequest(authExchangeRequest)
  .withResponse(authExchangeResponse);

// POST /auth/refresh - refresh tokens
export const refreshToken = api("POST", "/auth/refresh")
  .withRequest(refreshTokenRequest)
  .withResponse(refreshTokenResponse);

// POST /auth/send-magic-link - send magic link email
export const sendMagicLink = api("POST", "/auth/send-magic-link")
  .withRequest(sendMagicLinkRequest)
  .withResponse(sendMagicLinkResponse);
