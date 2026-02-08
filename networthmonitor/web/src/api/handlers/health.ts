import { getHealthApi } from "@broccoliapps/nwm-shared";
import { api } from "../lambda";

api.register(getHealthApi, async (_req, res) => {
  return res.ok({ status: "ok", timestamp: new Date().toISOString() });
});
