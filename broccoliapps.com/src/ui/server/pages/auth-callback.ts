import { db, HttpError, log } from "@broccoliapps/backend";
import { AppId, Cookie, Duration, globalConfig, random } from "@broccoliapps/shared";
import * as v from "valibot";
import { verifyAuthorizationCode } from "../../../auth/cognito-server";
import { getOrCreateUser } from "../../../auth/users";
import { page } from "../lambda";

page
  .withRequest({
    code: v.string(),
  })
  .handle("/auth/callback", async (req, ctx) => {
    const codeVerifier = ctx.getCookie("pkce_code_verifier");
    const app = ctx.getCookie("auth_app");
    const platform = ctx.getCookie("auth_platform");

    if (!codeVerifier || !app || !Object.keys(globalConfig.apps).includes(app)) {
      log.wrn("pkce_code_verifier or auth_app cookie not found - auth session expired");
      throw new HttpError(408, "Authentication session timed out. Please try again");
    }

    const result = await verifyAuthorizationCode(req.code, codeVerifier);

    if (!result.valid) {
      console.log("Failed to verify authorization code:", result.error);
      return {
        status: 302,
        html: "",
        headers: { Location: `/?error=${result.error}` },
      };
    }

    // Look up or create user in central users table
    const user = await getOrCreateUser(result.email, result.name);

    const expires = Duration.minutes(1).fromNow();

    const authCode = await db.broccoliapps.authCodes.put({
      code: random.token(),
      app,
      email: result.email,
      name: result.name,
      provider: result.provider,
      userId: user.id,
      expiresAt: expires.toMilliseconds(),
      ttl: expires.toSeconds(),
    });

    // Determine redirect URL: mobile deep link or web URL
    const appConfig = globalConfig.apps[app as AppId];
    const mobileScheme = "mobileScheme" in appConfig ? appConfig.mobileScheme : undefined;
    const redirectUrl = platform === "mobile" && mobileScheme
      ? `${mobileScheme}://auth/callback?code=${authCode.code}`
      : `${appConfig.baseUrl}/app/auth/callback?code=${authCode.code}`;

    // Clean up cookies and redirect
    return {
      status: 302,
      headers: { Location: redirectUrl },
      cookies: [
        Cookie.delete("pkce_code_verifier", {
          path: "/",
          sameSite: "lax",
          secure: true,
        }),
        Cookie.delete("app", {
          path: "/",
          sameSite: "lax",
          secure: true,
        }),
        Cookie.delete("auth_platform", {
          path: "/",
          sameSite: "lax",
          secure: true,
        }),
      ],
    };
  });
