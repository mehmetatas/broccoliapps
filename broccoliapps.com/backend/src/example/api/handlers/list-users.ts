import { api } from "../lambda";
import { listUsers } from "../../shared/api-contracts";

api.register(listUsers, async (_req, res) => {
  // TODO: actual implementation
  return res.ok({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});
