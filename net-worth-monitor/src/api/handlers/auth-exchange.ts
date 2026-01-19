import { auth } from "@broccoliapps/backend";
import { Duration } from "@broccoliapps/shared";
import { postAuthExchange } from "../../shared/api-contracts";
import { api } from "../lambda";

const accessTokenLifetime = Duration.days(1);
const refreshTokenLifetime = Duration.years(1);

auth.setConfig({
  appId: "networthmonitor",
  accessTokenLifetime,
  refreshTokenLifetime,
});

api.register(postAuthExchange, async (req, res) => {
  const tokens = await auth.exchange(req.code);
  return res.ok({
    ...tokens,
    accessTokenExpiresAt: accessTokenLifetime.fromNow().toMilliseconds(),
    refreshTokenExpiresAt: refreshTokenLifetime.fromNow().toMilliseconds(),
  });
});
