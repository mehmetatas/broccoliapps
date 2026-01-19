import { db, HttpError, log } from "@broccoliapps/backend";
import { AppId, Cookie, Duration, globalConfig, random } from "@broccoliapps/shared";
import * as v from "valibot";
import { verifyAuthorizationCode } from "../../../auth/cognito-server";
import { page } from "../lambda";

page
  .withRequest({
    code: v.string(),
  })
  .handle("/auth/callback", async (req, ctx) => {
    const codeVerifier = ctx.getCookie("pkce_code_verifier");
    const app = ctx.getCookie("auth_app");

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

    const expires = Duration.minutes(1).fromNow();

    const authCode = await db.broccoliapps.authCodes.put({
      code: random.token(),
      app,
      email: result.email,
      name: result.name,
      provider: result.provider,
      userId: result.userId,
      expiresAt: expires.toMilliseconds(),
      ttl: expires.toSeconds(),
    });

    // Clean up PKCE cookie and redirect to app
    return {
      status: 302,
      headers: { Location: globalConfig.apps[app as AppId].baseUrl + "/app/auth/callback?code=" + authCode.code },
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
      ],
    };
  });
