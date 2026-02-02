import { globalConfig, authExchange, refreshToken, sendMagicLink, verifyApple, centralSendEmail, centralVerifyNative, type AuthUserDto, epoch, setS2SProvider } from "@broccoliapps/shared";
import { crypto } from "../crypto";
import { users } from "../db/schemas/shared";
import { HttpError } from "../http";

import type { ApiRouter } from "../http/api-router";
import { auth } from "./index";
import { getAuthConfig } from "./config";
import { JwtData } from "./jwt";
import { verifyAppleIdentityToken } from "./apple";

export type UseAuthOptions = {
  onNewUser?: (user: JwtData) => Promise<void>;
};

const ensureUser = async (data: JwtData): Promise<boolean> => {
  const existing = await users.get({ id: data.userId });
  if (existing) {
    return false;
  }

  const now = epoch.millis();
  await users.put({
    id: data.userId,
    email: data.email,
    name: data.name,
    signInProvider: data.provider,
    createdAt: now,
    updatedAt: now,
  });
  return true;
};

export const registerAuthHandlers = (api: ApiRouter, options?: UseAuthOptions) => {
  const { appId } = getAuthConfig();
  setS2SProvider({
    appId,
    sign: (hash) => crypto.rsaPrivateEncrypt(appId, hash),
  });

  api.register(authExchange, async (req, res) => {
    const result = await auth.exchange(req.code);
    const { accessTokenLifetime, refreshTokenLifetime } = getAuthConfig();

    const isNewUser = await ensureUser(result.user);
    if (isNewUser && options?.onNewUser) {
      await options.onNewUser(result.user);
    }

    const authUser: AuthUserDto = {
      id: result.user.userId,
      email: result.user.email,
      name: result.user.name,
      isNewUser,
    };

    return res.ok({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: accessTokenLifetime.fromNow().toMilliseconds(),
      refreshTokenExpiresAt: refreshTokenLifetime.fromNow().toMilliseconds(),
      user: authUser,
    });
  });

  api.register(refreshToken, async (req, res) => {
    const newTokens = await auth.refresh(req.refreshToken);

    if (!newTokens) {
      throw new HttpError(403, "Invalid refresh token");
    }

    const { accessTokenLifetime, refreshTokenLifetime } = getAuthConfig();

    return res.ok({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      accessTokenExpiresAt: accessTokenLifetime.fromNow().toMilliseconds(),
      refreshTokenExpiresAt: refreshTokenLifetime.fromNow().toMilliseconds(),
    });
  });

  api.register(sendMagicLink, async (req, res) => {
    const { appId } = getAuthConfig();

    await centralSendEmail.invoke(
      { app: appId, email: req.email, ...req.platform && { platform: req.platform } },
      { baseUrl: globalConfig.apps["broccoliapps-com"].baseUrl }
    );

    return res.ok({ success: true });
  });

  api.register(verifyApple, async (req, res) => {
    const { appId } = getAuthConfig();

    // 1. Verify Apple identity token JWT
    const applePayload = await verifyAppleIdentityToken(req.identityToken);

    // 2. Derive name from fullName param (Apple only sends on first sign-in) or email
    const givenName = req.fullName?.givenName;
    const familyName = req.fullName?.familyName;
    const name = givenName || familyName
      ? [givenName, familyName].filter(Boolean).join(" ")
      : applePayload.email.split("@")[0] ?? "User";

    // 3. Call broccoliapps verify-native to get/create central user
    const { user: centralUser } = await centralVerifyNative.invoke(
      { app: appId, email: applePayload.email, name, provider: "apple" as const },
      { baseUrl: globalConfig.apps["broccoliapps-com"].baseUrl }
    );

    // 4. Generate tokens
    const tokenData: JwtData = {
      userId: centralUser.userId,
      email: centralUser.email,
      name: centralUser.name,
      provider: "apple",
    };

    const result = await auth.generateTokens(tokenData);

    const isNewUser = await ensureUser(tokenData);
    if (isNewUser && options?.onNewUser) {
      await options.onNewUser(tokenData);
    }

    const { accessTokenLifetime, refreshTokenLifetime } = getAuthConfig();

    const authUser: AuthUserDto = {
      id: centralUser.userId,
      email: centralUser.email,
      name: centralUser.name,
      isNewUser,
    };

    return res.ok({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: accessTokenLifetime.fromNow().toMilliseconds(),
      refreshTokenExpiresAt: refreshTokenLifetime.fromNow().toMilliseconds(),
      user: authUser,
    });
  });
};
