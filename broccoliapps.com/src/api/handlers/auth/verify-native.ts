import { auth, HttpError, log } from "@broccoliapps/backend";
import { AppId } from "@broccoliapps/shared";
import { getOrCreateUser } from "../../../auth/users";
import { verifyNative } from "../../../shared/api-contracts";
import { api } from "../../lambda";

api.register(verifyNative, async (req, res) => {
  try {
    // 1. Verify S2S auth: app encrypts email with RSA private key, broccoliapps decrypts with public key
    const decryptedEmail = auth.verifyAuthCode(req.app as AppId, req.code);

    if (!decryptedEmail) {
      throw new HttpError(403, "Auth code could not be verified");
    }

    if (decryptedEmail !== req.email) {
      throw new HttpError(403, "Email does not match auth code");
    }

    // 2. Get or create user in central users table
    const user = await getOrCreateUser(req.email, req.name, req.provider);

    return res.ok({
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
        provider: user.signInProvider,
      },
    });
  } catch (error) {
    log.err("Failed to verify native auth", { error });
    throw error;
  }
});
