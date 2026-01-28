import { api } from "@broccoliapps/shared";
import {
  authExchangeRequest,
  authExchangeResponse,
  refreshTokenRequest,
  refreshTokenResponse,
} from "./auth.dto";

// POST /auth/exchange - exchange code for tokens
export const authExchange = api("POST", "/auth/exchange")
  .withRequest(authExchangeRequest)
  .withResponse(authExchangeResponse);

// POST /auth/refresh - refresh tokens
export const refreshToken = api("POST", "/auth/refresh")
  .withRequest(refreshTokenRequest)
  .withResponse(refreshTokenResponse);
