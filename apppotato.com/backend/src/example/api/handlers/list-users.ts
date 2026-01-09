import { listUsers } from "../../../framework/shared/api-contracts";
import { app } from "../../app";

app.api(listUsers, async (_req, res) => {
  // TODO: actual implementation
  return res.ok({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});
