import { api } from "@broccoliapps/shared";
import { verifyNativeRequest, verifyNativeResponse } from "./auth-native.dto";

// POST /v1/auth/verify-native - verify native sign-in (e.g. Apple on iOS)
export const verifyNative = api("POST", "/v1/auth/verify-native")
  .withRequest(verifyNativeRequest)
  .withResponse(verifyNativeResponse);
