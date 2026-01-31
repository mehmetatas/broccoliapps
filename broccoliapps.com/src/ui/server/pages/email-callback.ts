import { HttpError, log } from "@broccoliapps/backend";
import { authCodes, magicLinkTokens } from "../../../db/schemas";
import { AppId, Duration, globalConfig, isExpired, random } from "@broccoliapps/shared";
import * as v from "valibot";
import { getOrCreateUser } from "../../../auth/users";
import { page } from "../lambda";

page
  .withRequest({
    token: v.string(),
  })
  .handle("/auth/email-callback", async (req) => {
    // 1. Look up token in DynamoDB
    const magicLink = await magicLinkTokens.get({ token: req.token });

    if (!magicLink) {
      log.wrn("Magic link token not found", { token: req.token.slice(0, 8) + "..." });
      throw new HttpError(404, "Invalid or expired link");
    }

    // 2. Verify not expired
    if (isExpired(magicLink)) {
      log.wrn("Magic link token expired", { token: req.token.slice(0, 8) + "..." });
      await magicLinkTokens.delete({ token: req.token });
      throw new HttpError(410, "This link has expired. Please request a new one.");
    }

    // 3. Delete token (single-use)
    await magicLinkTokens.delete({ token: req.token });

    // 4. Derive name from email: john.doe@gmail.com -> "John Doe"
    const name = deriveNameFromEmail(magicLink.email);

    // 5. Look up or create user in central users table
    const user = await getOrCreateUser(magicLink.email, name, "email");

    // 6. Create authCode (same as OAuth flow, provider="email")
    const expires = Duration.minutes(1).fromNow();
    const authCode = await authCodes.put({
      code: random.token(),
      app: magicLink.app,
      email: magicLink.email,
      name,
      provider: "email",
      userId: user.id,
      expiresAt: expires.toMilliseconds(),
      ttl: expires.toSeconds(),
    });

    log.inf("Magic link verified, redirecting to app", { app: magicLink.app, email: magicLink.email });

    // 7. Redirect to mobile deep link or web URL
    const appConfig = globalConfig.apps[magicLink.app as AppId];
    const mobileScheme = "mobileScheme" in appConfig ? appConfig.mobileScheme : undefined;
    const redirectUrl = magicLink.platform === "mobile" && mobileScheme
      ? `${mobileScheme}://auth/callback?code=${authCode.code}`
      : `${appConfig.baseUrl}/app/auth/callback?code=${authCode.code}`;

    return {
      status: 302,
      headers: { Location: redirectUrl },
    };
  });

/**
 * Derive a display name from an email address
 * john.doe@gmail.com -> "John Doe"
 * jsmith@company.com -> "Jsmith"
 */
const deriveNameFromEmail = (email: string): string => {
  const localPart = email.split("@")[0] ?? "";

  // Replace dots, underscores, hyphens with spaces
  const parts = localPart.split(/[._-]+/);

  // Capitalize each part
  const capitalized = parts.map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );

  return capitalized.join(" ");
};
