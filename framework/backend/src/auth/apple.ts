import * as jose from "jose";
import { globalConfig } from "@broccoliapps/shared";
import { getAuthConfig } from "./config";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");

let jwks: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

const getJWKS = () => {
  if (!jwks) {
    jwks = jose.createRemoteJWKSet(APPLE_JWKS_URL);
  }
  return jwks;
};

type AppleTokenPayload = {
  email: string;
  sub: string;
};

export const verifyAppleIdentityToken = async (identityToken: string): Promise<AppleTokenPayload> => {
  const { appId } = getAuthConfig();
  const appConfig = globalConfig.apps[appId];

  const audience = "appleAudience" in appConfig ? (appConfig.appleAudience as string) : undefined;
  if (!audience) {
    throw new Error(`Apple audience not configured for app "${appId}". Add appleAudience to globalConfig.`);
  }

  const { payload } = await jose.jwtVerify(identityToken, getJWKS(), {
    issuer: APPLE_ISSUER,
    audience,
  });

  const email = payload.email as string | undefined;
  const sub = payload.sub;

  if (!email || !sub) {
    throw new Error("Apple identity token missing email or sub");
  }

  return { email, sub };
};
