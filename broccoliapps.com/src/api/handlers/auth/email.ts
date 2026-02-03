import { HttpError, log, rateLimiter } from "@broccoliapps/backend";
import { type AppId, Duration, random, centralSendEmail as sendMagicLink } from "@broccoliapps/shared";
import { magicLinkTokens } from "../../../db/schemas";
import { sendMagicLinkEmail } from "../../../email";
import { api } from "../../lambda";

api.register(sendMagicLink, async (req, res) => {
  try {
    // 1. Check rate limit (5 emails/hour/email address)
    try {
      await rateLimiter.enforce(
        {
          limit: 5,
          period: "1h",
          context: "email",
          action: "magic-link",
        },
        { email: req.email },
      );
    } catch {
      throw new HttpError(429, "Too many requests. Please try again later.");
    }

    // 2. Generate 64-char random token, store with 15-min TTL
    const token = random.token(64);
    const expires = Duration.minutes(15).fromNow();

    await magicLinkTokens.put({
      token,
      email: req.email,
      app: req.app,
      ...(req.platform && { platform: req.platform }),
      createdAt: Date.now(),
      expiresAt: expires.toMilliseconds(),
      ttl: expires.toSeconds(),
    });

    // 3. Send email
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
