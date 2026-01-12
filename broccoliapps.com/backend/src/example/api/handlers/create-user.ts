import { api } from "../lambda";
import { createUser } from "../../shared/api-contracts";

api.register(createUser, async (req, res) => {
  // TODO: actual implementation
  return res.created({
    id: 1,
    name: req.name,
    email: req.email,
  });
});
