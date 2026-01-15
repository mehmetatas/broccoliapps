import { db, ttl } from "@broccoliapps/backend";
import { random } from "@broccoliapps/shared";
import * as v from "valibot";
import { verifyAuthorizationCode } from "../../../auth/cognito-server";
import { page } from "../lambda";

page
  .withRequest({
    code: v.string(),
  })
  .handle("/auth/callback", async (req, ctx) => {
    const codeVerifier = ctx.getCookie("pkce_code_verifier");

    if (!codeVerifier) {
      console.log("pkce_code_verifier cookie not found - auth session expired");
      return {
        status: 302,
        data: "",
        headers: { Location: "/?error=expired" },
      };
    }

    const result = await verifyAuthorizationCode(req.code, codeVerifier);

    if (!result.valid) {
      console.log("Failed to verify authorization code:", result.error);
      return {
        status: 302,
        data: "",
        headers: { Location: `/?error=${result.error}` },
      };
    }

    await db.broccoliapps.authCodes.put({
      code: random.token(),
      email: result.email,
      name: result.name,
      provider: result.provider,
      userId: result.userId,
      ttl: ttl(1, "min"),
    });

    // Clean up PKCE cookie and redirect to app
    return {
      status: 302,
      data: "",
      headers: { Location: "/" },
      cookies: [
        {
          name: "pkce_code_verifier",
          value: "",
          maxAge: 0,
          path: "/",
          sameSite: "Lax",
          secure: true,
        },
        {
          name: "app",
          value: "",
          maxAge: 0,
          path: "/",
          sameSite: "Lax",
          secure: true,
        },
      ],
    };
  });
