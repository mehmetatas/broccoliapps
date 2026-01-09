import { createUser } from "../../../framework/shared/api-contracts";
import { app } from "../../app";

app.api(createUser, async (req, res) => {
  // TODO: actual implementation
  return res.created({
    id: 1,
    name: req.name,
    email: req.email,
  });
});
