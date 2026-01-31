import { AppId, epoch, globalConfig, random } from "@broccoliapps/shared";
import { crypto } from "../crypto";
import { tokens, users } from "../db/schemas/shared";
import { HttpError } from "../http";
import { log } from "../log";
import { getAuthConfig } from "./config";
import { jwt, JwtData } from "./jwt";

export type AuthTokens = { accessToken: string; refreshToken: string; user: JwtData };

const exchange = async (authCode: string): Promise<AuthTokens> => {
  const { appId } = getAuthConfig();

  const code = await crypto.rsaPrivateEncrypt(appId, authCode);

  const body = JSON.stringify({ app: appId, code });

  const resp = await fetch(globalConfig.apps["broccoliapps-com"].baseUrl + "/api/v1/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-amz-content-sha256": crypto.sha256(body) },
    body,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new HttpError(resp.status ?? 500, err.message ?? "Unable to exchange auth token");
  }

  const { user } = (await resp.json()) as { user: JwtData };

  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user.userId);

  return { accessToken, refreshToken, user };
};

const verifyAuthCode = (app: AppId, encrypted: string) => {
  try {
    return crypto.rsaPublicDecrypt(app, encrypted);
  } catch (error) {
    log.wrn("Could not decrypt auth code", { app, error });
    return undefined;
  }
};

const refresh = async (refreshToken: string): Promise<AuthTokens | undefined> => {
  const hash = crypto.sha256(refreshToken);
  const token = await tokens.get({ hash });
  if (!token || token.expiresAt < epoch.millis()) {
    return undefined;
  }

  const dbUser = await users.get({ id: token.userId });
  if (!dbUser) {
    log.wrn("User not found for refresh token", { userId: token.userId });
    return undefined;
  }

  const user: JwtData = {
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    provider: dbUser.signInProvider,
  };

  // if refresh token completed 80% of its life time refresh it too
  if ((token.expiresAt - epoch.millis()) / getAuthConfig().refreshTokenLifetime.toMilliseconds() < 0.2) {
    [refreshToken] = await Promise.all([createRefreshToken(user.userId), tokens.delete({ hash })]);
  }

  const accessToken = await createAccessToken(user);

  return { accessToken, refreshToken, user };
};

const verifyAccessToken = async (accessToken: string): Promise<JwtData | undefined> => {
  const decoded = await jwt.verify(accessToken);
  if (!decoded) {
    return undefined;
  }
  if (decoded.exp < epoch.seconds()) {
    return undefined;
  }
  return decoded.data;
};

const createAccessToken = (data: JwtData) => {
  return jwt.sign(data);
};

const createRefreshToken = async (userId: string): Promise<string> => {
  const token = random.token(128);
  const hash = crypto.sha256(token);

  const expires = getAuthConfig().refreshTokenLifetime.fromNow();

  await tokens.put({
    hash,
    type: "refresh",
    userId,
    createdAt: epoch.millis(),
    expiresAt: expires.toMilliseconds(),
    ttl: expires.toSeconds(),
  });

  return token;
};

const generateTokens = async (data: JwtData): Promise<AuthTokens> => {
  const accessToken = await createAccessToken(data);
  const refreshToken = await createRefreshToken(data.userId);
  return { accessToken, refreshToken, user: data };
};

export const authToken = {
  exchange,
  verifyAuthCode,
  refresh,
  verifyAccessToken,
  generateTokens,
  // todo: token invalidation
};
