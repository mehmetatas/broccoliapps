import { page } from "../lambda";
import { userDetailPage } from "./contracts";

page.register(userDetailPage, async (req, res) => {
  // TODO: fetch from database
  return res.render({
    id: req.id,
    name: "Alice",
    email: "alice@example.com",
  });
});
