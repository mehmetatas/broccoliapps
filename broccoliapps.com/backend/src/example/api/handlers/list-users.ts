import { app } from "../../app";
import { listUsers } from "../../shared/api-contracts";

app.api(listUsers, async (_req, res) => {
  // TODO: actual implementation
  return res.ok({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});
