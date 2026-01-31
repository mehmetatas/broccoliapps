import { auth, HttpError, log } from "@broccoliapps/backend";
import { authCodes } from "@broccoliapps/backend/dist/db/schemas/broccoliapps";
import { AppId, isExpired } from "@broccoliapps/shared";
import { verifyAuthToken } from "../../../shared/api-contracts";
import { api } from "../../lambda";

api.register(verifyAuthToken, async (req, res) => {
  try {
    const code = auth.verifyAuthCode(req.app as AppId, req.code);

    log.inf("REMOVE THIS LOG - Auth code verified", { code });

    if (!code) {
      log.wrn("Invalid auth code", { req });
      throw new HttpError(403, "Auth code could not be verified");
    }

    const authCode = await authCodes.get({ code });

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
