import { app } from "../../app";
import { deleteUser } from "../../shared/api-contracts";

app.api(deleteUser, async (_req, res) => {
  // TODO: actual implementation
  return res.noContent();
});
