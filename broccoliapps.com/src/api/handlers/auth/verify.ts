import { HttpError, log } from "@broccoliapps/backend";
import { isExpired, centralVerifyAuth as verifyAuthToken } from "@broccoliapps/shared";
import { authCodes } from "../../../db/schemas";
import { api } from "../../lambda";

api.register(verifyAuthToken, async (req, res) => {
  try {
    const authCode = await authCodes.get({ code: req.code });

    if (!authCode || isExpired(authCode) || authCode.app !== req.app) {
      log.wrn("Invalid auth code", { authCode, req });
      throw new HttpError(404, "Auth code not found");
    }

    await authCodes.delete(authCode);

    const { name, provider, email, userId } = authCode;
    return res.ok({ user: { name, provider, email, userId } });
  } catch (error) {
    log.err("Failed to verify token", { error });
    throw error;
  }
});
