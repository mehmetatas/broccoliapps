import { app } from "../../../app";
import { listUsersPage } from "../contracts";

app.page(listUsersPage, async (_req, res) => {
  // TODO: fetch from database
  return res.render({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});
