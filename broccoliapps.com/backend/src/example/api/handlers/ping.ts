import { app } from "../../app";
import { ping } from "../../shared/api-contracts";

app.api(ping, async (_req, res) => {
  return res.noContent();
});
