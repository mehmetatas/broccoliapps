import { listUsersPage } from "../contracts";
import { app } from "../../app";

app.page(listUsersPage, async (_req, res) => {
  // TODO: fetch from database
  return res.render({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});
