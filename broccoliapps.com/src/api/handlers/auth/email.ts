import { auth, HttpError, log, rateLimiter } from "@broccoliapps/backend";
import { magicLinkTokens } from "@broccoliapps/backend/dist/db/schemas/broccoliapps";
import { AppId, Duration, random } from "@broccoliapps/shared";
import { sendMagicLinkEmail } from "../../../email";
import { sendMagicLink } from "../../../shared/api-contracts";
import { api } from "../../lambda";

api.register(sendMagicLink, async (req, res) => {
  try {
    // 1. Verify S2S auth: app encrypts email with RSA private key, broccoliapps decrypts with public key
    const decryptedEmail = auth.verifyAuthCode(req.app as AppId, req.code);

    if (!decryptedEmail) {
      throw new HttpError(403, "Auth code could not be verified");
    }

    if (decryptedEmail !== req.email) {
      throw new HttpError(403, "Email does not match auth code");
    }

    // 2. Check rate limit (5 emails/hour/email address)
    try {
      await rateLimiter.enforce(
        {
          limit: 5,
          period: "1h",
          context: "email",
          action: "magic-link",
        },
        { email: req.email }
      );
    } catch {
      throw new HttpError(429, "Too many requests. Please try again later.");
    }

    // 3. Generate 64-char random token, store with 15-min TTL
    const token = random.token(64);
    const expires = Duration.minutes(15).fromNow();

    await magicLinkTokens.put({
      token,
      email: req.email,
      app: req.app,
      createdAt: Date.now(),
      expiresAt: expires.toMilliseconds(),
      ttl: expires.toSeconds(),
    });

    // 4. Send email
    await sendMagicLinkEmail({
      to: req.email,
      app: req.app as AppId,
      token,
    });

    log.inf("Magic link email sent", { app: req.app, email: req.email });

    return res.ok({ success: true });
  } catch (error) {
    log.err("Failed to send magic link email", { error });
    throw error;
  }
});
