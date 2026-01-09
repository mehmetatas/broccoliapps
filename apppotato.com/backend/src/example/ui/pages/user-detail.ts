import { userDetailPage } from "../contracts";
import { app } from "../../app";

app.page(userDetailPage, async (req, res) => {
  // TODO: fetch from database
  return res.render({
    id: req.id,
    name: "Alice",
    email: "alice@example.com",
  });
});
