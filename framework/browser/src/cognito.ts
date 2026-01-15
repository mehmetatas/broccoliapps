import { cookies } from "./cookies";

export type CognitoIdentityProvider = "google" | "facebook" | "apple";

const IdentityProviderMap: Record<CognitoIdentityProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "SignInWithApple",
};

const getConfig = () => {
  const isDev = window.location.hostname === "localhost";
  return {
    domain: "auth.broccoliapps.com",
    userPoolClientId: "43it6h2h4d6sml8ks7199redv2",
    baseUrl: isDev ? "http://localhost:8080" : "https://www.broccoliapps.com",
  };
};

const generateChallengeCode = (): string => {
  const randomBytes = new Uint8Array(32); // 32 bytes = 256 bits
  window.crypto.getRandomValues(randomBytes);
  // Base64-urlencode the random bytes
  return btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const generateChallengeHash = async (code: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const digest = await window.crypto.subtle.digest("SHA-256", data);

  // Base64-urlencode the SHA-256 digest
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
};

const signInWith = async (provider: CognitoIdentityProvider, app: string): Promise<void> => {
  const config = getConfig();
  const code = generateChallengeCode();
  const hash = await generateChallengeHash(code);

  const params = new URLSearchParams({
    identity_provider: IdentityProviderMap[provider],
    response_type: "code",
    client_id: config.userPoolClientId,
    redirect_uri: `${config.baseUrl}/auth/callback`,
    scope: "email openid profile",
    code_challenge: hash,
    code_challenge_method: "S256",
  });

  const authUrl = `https://${config.domain}/oauth2/authorize?${params.toString()}`;

  cookies.set("pkce_code_verifier", code, {
    maxAge: 300, // 5 minutes
    path: "/",
    sameSite: "Lax",
    secure: true,
  });

  cookies.set("auth_app", app, {
    maxAge: 300, // 5 minutes
    path: "/",
    sameSite: "Lax",
    secure: true,
  });

  window.location.href = authUrl;
};

export const cognitoClient = {
  signInWith,
};
