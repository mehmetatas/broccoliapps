import { auth, crypto, HttpError, log } from "@broccoliapps/backend";
import { Duration, globalConfig } from "@broccoliapps/shared";
import { users } from "../../db/users";
import { initializeNewUser } from "../../db/initializeNewUser";
import { authExchange, refreshToken, sendMagicLink, verifyApple, type AuthUserDto } from "@broccoliapps/tasquito-shared";
import { api } from "../lambda";
import { verifyAppleIdentityToken } from "../apple-auth";

const accessTokenLifetime = globalConfig.isProd ? Duration.days(1) : Duration.minutes(5);
const refreshTokenLifetime = globalConfig.isProd ? Duration.years(1) : Duration.hours(1);

auth.setConfig({
  appId: "tasquito",
  accessTokenLifetime,
  refreshTokenLifetime,
});

api.register(authExchange, async (req, res) => {
  const { accessToken, refreshToken, user: jwtUser } = await auth.exchange(req.code);

  log.dbg("JWT user", jwtUser);

  // Check if user exists by email
  const existingUsers = await users.query.byEmail({ email: jwtUser.email }).all();
  let existingUser = existingUsers[0];
  let isNewUser = false;

  log.dbg("Existing user", existingUser);

  if (!existingUser) {
    // Create new user
    isNewUser = true;
    const now = Date.now();
    existingUser = await users.put({
      id: jwtUser.userId,
      email: jwtUser.email,
      name: jwtUser.name,
      signInProvider: jwtUser.provider,
      createdAt: now,
      updatedAt: now,
    });

    // Initialize new user with tutorial project
    await initializeNewUser(existingUser.id);
  }

  const authUser: AuthUserDto = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    isNewUser,
  };

  log.dbg("Auth user", authUser);

  return res.ok({
    accessToken,
    refreshToken,
    accessTokenExpiresAt: accessTokenLifetime.fromNow().toMilliseconds(),
    refreshTokenExpiresAt: refreshTokenLifetime.fromNow().toMilliseconds(),
    user: authUser,
  });
});

api.register(refreshToken, async (req, res) => {
  const newTokens = await auth.refresh(req.refreshToken, async (id) => {
    const user = await users.get({ id });
    if (!user) {
      throw new HttpError(403, "User not found");
    }
    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      provider: user.signInProvider,
    };
  });

  if (!newTokens) {
    throw new HttpError(403, "Invalid refresh token");
  }

  return res.ok({
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    accessTokenExpiresAt: accessTokenLifetime.fromNow().toMilliseconds(),
    refreshTokenExpiresAt: refreshTokenLifetime.fromNow().toMilliseconds(),
  });
});

api.register(sendMagicLink, async (req, res) => {
  // Sign email with app's RSA private key for S2S verification
  const code = await crypto.rsaPrivateEncrypt("tasquito", req.email);

  // Call broccoliapps S2S API (forward platform for mobile deep link redirect)
  const body = JSON.stringify({ app: "tasquito", email: req.email, code, ...(req.platform && { platform: req.platform }) });
  const resp = await fetch(
    globalConfig.apps["broccoliapps-com"].baseUrl + "/api/v1/auth/email",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-amz-content-sha256": crypto.sha256(body),
      },
      body,
    }
  );

  if (!resp.ok) {
    const err = (await resp.json()) as { message?: string };
    throw new HttpError(resp.status, err.message || "Failed to send magic link");
  }

  return res.ok({ success: true });
});

api.register(verifyApple, async (req, res) => {
  // 1. Verify Apple identity token JWT
  const applePayload = await verifyAppleIdentityToken(req.identityToken);

  // 2. Derive name from fullName param (Apple only sends on first sign-in) or email
  const givenName = req.fullName?.givenName;
  const familyName = req.fullName?.familyName;
  const name = givenName || familyName
    ? [givenName, familyName].filter(Boolean).join(" ")
    : applePayload.email.split("@")[0] ?? "User";

  // 3. RSA-encrypt email with tasquito's private key for S2S verification
  const code = await crypto.rsaPrivateEncrypt("tasquito", applePayload.email);

  // 4. Call broccoliapps verify-native to get/create central user
  const verifyBody = JSON.stringify({
    app: "tasquito",
    code,
    email: applePayload.email,
    name,
    provider: "apple",
  });
  const verifyResp = await fetch(
    globalConfig.apps["broccoliapps-com"].baseUrl + "/api/v1/auth/verify-native",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-amz-content-sha256": crypto.sha256(verifyBody),
      },
      body: verifyBody,
    }
  );

  if (!verifyResp.ok) {
    const err = (await verifyResp.json()) as { message?: string };
    throw new HttpError(verifyResp.status, err.message || "Failed to verify native auth");
  }

  const { user: centralUser } = (await verifyResp.json()) as { user: { userId: string; email: string; name: string; provider: string } };

  // 5. Get/create tasquito user (same pattern as authExchange)
  const existingUsers = await users.query.byEmail({ email: centralUser.email }).all();
  let existingUser = existingUsers[0];
  let isNewUser = false;

  if (!existingUser) {
    isNewUser = true;
    const now = Date.now();
    existingUser = await users.put({
      id: centralUser.userId,
      email: centralUser.email,
      name: centralUser.name,
      signInProvider: "apple",
      createdAt: now,
      updatedAt: now,
    });

    await initializeNewUser(existingUser.id);
  }

  // 6. Generate tokens
  const tokens = await auth.generateTokens({
    userId: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    provider: "apple",
  });

  const authUser: AuthUserDto = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    isNewUser,
  };

  return res.ok({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: accessTokenLifetime.fromNow().toMilliseconds(),
    refreshTokenExpiresAt: refreshTokenLifetime.fromNow().toMilliseconds(),
    user: authUser,
  });
});
