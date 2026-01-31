import * as jose from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS_URL = new URL("https://appleid.apple.com/auth/keys");
const APPLE_AUDIENCE = "com.broccoliapps.tasquito.ios";

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
  const { payload } = await jose.jwtVerify(identityToken, getJWKS(), {
    issuer: APPLE_ISSUER,
    audience: APPLE_AUDIENCE,
  });

  const email = payload.email as string | undefined;
  const sub = payload.sub;

  if (!email || !sub) {
    throw new Error("Apple identity token missing email or sub");
  }

  return { email, sub };
};
