import { log } from "@broccoliapps/backend";
import { centralVerifyNative as verifyNative } from "@broccoliapps/shared";
import { getOrCreateUser } from "../../../auth/users";
import { api } from "../../lambda";

api.register(verifyNative, async (req, res) => {
  try {
    // 1. Get or create user in central users table
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
