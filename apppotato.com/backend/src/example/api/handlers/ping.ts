import { ping } from "../../../framework/shared/api-contracts";
import { app } from "../../app";

app.api(ping, async (_req, res) => {
  return res.noContent();
});
