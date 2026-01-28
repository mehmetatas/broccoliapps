import { getHealth } from "@broccoliapps/tasquito-shared";
import { api } from "../lambda";

api.register(getHealth, async (_req, res) => {
  return res.ok({ status: "ok", timestamp: new Date().toISOString() });
});
