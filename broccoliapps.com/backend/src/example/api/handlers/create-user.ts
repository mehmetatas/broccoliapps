import { app } from "../../app";
import { createUser } from "../../shared/api-contracts";

app.api(createUser, async (req, res) => {
  // TODO: actual implementation
  return res.created({
    id: 1,
    name: req.name,
    email: req.email,
  });
});
