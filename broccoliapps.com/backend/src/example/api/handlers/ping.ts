import { api } from "../lambda";
import { ping } from "../../shared/api-contracts";

api.register(ping, async (_req, res) => {
  return res.noContent();
});
