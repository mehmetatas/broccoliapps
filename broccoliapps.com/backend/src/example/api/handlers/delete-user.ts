import { api } from "../lambda";
import { deleteUser } from "../../shared/api-contracts";

api.register(deleteUser, async (_req, res) => {
  // TODO: actual implementation
  return res.noContent();
});
