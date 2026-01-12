import { ListUsersPage } from "../../client";
import { page } from "../lambda";

page.route("/users", ListUsersPage).handler(async (_req, res) => {
  // TODO: fetch from database
  return res.render({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});
