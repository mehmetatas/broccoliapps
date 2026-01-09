import { deleteUser } from "../../../framework/shared/api-contracts";
import { app } from "../../app";

app.api(deleteUser, async (_req, res) => {
  // TODO: actual implementation
  return res.noContent();
});
