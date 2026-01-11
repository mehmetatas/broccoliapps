import { app } from "../../../app";
import { userDetailPage } from "../contracts";

app.page(userDetailPage, async (req, res) => {
  // TODO: fetch from database
  return res.render({
    id: req.id,
    name: "Alice",
    email: "alice@example.com",
  });
});
