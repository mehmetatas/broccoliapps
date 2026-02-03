import { params } from "@broccoliapps/backend";
import { config } from "../shared/config";

type CognitoTokenData = {
  id_token: string;
  access_token: string;
  refresh_token?: string;
};

type CognitoError = {
  error: string;
  error_description?: string;
};

type CognitoResponse = CognitoTokenData | CognitoError;

export type CognitoIdTokenPayload = {
  sub: string;
  email: string;
  name: string;
  identities: Array<{ providerName: string }>;
};

type AuthorizationCodeResponse =
  | {
      valid: true;
      userId: string;
      email: string;
      name: string;
      provider: "google" | "facebook" | "apple";
      idToken: string;
    }
  | {
      valid: false;
      error: string;
    };

const decodeJwt = <T>(token: string): T => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = parts[1]!;
  const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(decoded);
};

const callTokenEndpoint = async (request: Record<string, string>): Promise<CognitoTokenData> => {
  const response = await fetch(`https://${config.cognito.domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(request),
  });

  const resp = (await response.json()) as CognitoResponse;

  if (!response.ok) {
    throw new Error(
      `Failed to fetch tokens: ${(resp as CognitoError).error || "Unknown error"} ${
        (resp as CognitoError).error_description || ""
      } Cognito response (${response.status})`,
    );
  }

  return resp as CognitoTokenData;
};

export const verifyAuthorizationCode = async (code: string, codeVerifier: string): Promise<AuthorizationCodeResponse> => {
  const clientSecret = await params.get(config.cognito.userPoolClientSecretName);

  const tokenData = await callTokenEndpoint({
    code,
    grant_type: "authorization_code",
    client_id: config.cognito.userPoolClientId,
    client_secret: clientSecret,
    redirect_uri: `${config.baseUrl}/auth/callback`,
    code_verifier: codeVerifier,
  });

  if (!tokenData.id_token) {
    return { valid: false, error: "missing_id_token" };
  }

  const idTokenPayload = decodeJwt<CognitoIdTokenPayload>(tokenData.id_token);
  const cognitoProvider = idTokenPayload.identities?.[0]?.providerName?.toLowerCase();
  const provider = cognitoProvider === "SigninWithApple" ? "apple" : (cognitoProvider?.toLocaleLowerCase() as "google" | "facebook");

  const email = idTokenPayload.email;
  const name = idTokenPayload.name ?? email.split("@")[0] ?? "";
  const userId = idTokenPayload.sub;

  if (!email || !provider) {
    return { valid: false, error: "invalid_id_token" };
  }

  return { valid: true, userId, email, name, provider, idToken: tokenData.id_token };
};
