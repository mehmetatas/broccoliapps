import {
  centralSendEmailRequest,
  centralSendEmailResponse,
  centralVerifyAuthRequest,
  centralVerifyAuthResponse,
  centralVerifyNativeRequest,
  centralVerifyNativeResponse,
} from "./central-auth.dto";
import { api } from "./contract";

// POST /v1/auth/verify — S2S: exchange encrypted auth code for central user
export const centralVerifyAuth = api("POST", "/v1/auth/verify").s2s().withRequest(centralVerifyAuthRequest).withResponse(centralVerifyAuthResponse);

// POST /v1/auth/email — S2S: send magic link email
export const centralSendEmail = api("POST", "/v1/auth/email").s2s().withRequest(centralSendEmailRequest).withResponse(centralSendEmailResponse);

// POST /v1/auth/verify-native — S2S: verify native sign-in (e.g. Apple on iOS)
export const centralVerifyNative = api("POST", "/v1/auth/verify-native")
  .s2s()
  .withRequest(centralVerifyNativeRequest)
  .withResponse(centralVerifyNativeResponse);
