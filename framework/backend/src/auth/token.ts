import { centralVerifyAuth, epoch, globalConfig, random } from "@broccoliapps/shared";
import { crypto } from "../crypto";
import { tokens, users } from "../db/schemas/shared";
import { log } from "../log";
import { getAuthConfig } from "./config";
import { JwtData, jwt } from "./jwt";

export type AuthTokens = { accessToken: string; refreshToken: string; user: JwtData };

const exchange = async (authCode: string): Promise<AuthTokens> => {
  const { appId } = getAuthConfig();

  const { user } = await centralVerifyAuth.invoke({ app: appId, code: authCode }, { baseUrl: globalConfig.apps["broccoliapps-com"].baseUrl });

  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user.userId);

  return { accessToken, refreshToken, user };
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
  refresh,
  verifyAccessToken,
  generateTokens,
  // todo: token invalidation
};
