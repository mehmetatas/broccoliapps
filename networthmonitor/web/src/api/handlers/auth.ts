import { auth, HttpError, log } from "@broccoliapps/backend";
import { Duration, globalConfig } from "@broccoliapps/shared";
import { users } from "../../db/users";
import { authExchange, refreshToken, type AuthUserDto } from "../../shared/api-contracts";
import { api } from "../lambda";

const accessTokenLifetime = globalConfig.isProd ? Duration.days(1) : Duration.minutes(5);
const refreshTokenLifetime = globalConfig.isProd ? Duration.years(1) : Duration.hours(1);

auth.setConfig({
  appId: "networthmonitor",
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
      targetCurrency: "",
      createdAt: now,
      updatedAt: now,
    });
  }

  const authUser: AuthUserDto = {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
    isNewUser,
    targetCurrency: existingUser.targetCurrency || null,
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