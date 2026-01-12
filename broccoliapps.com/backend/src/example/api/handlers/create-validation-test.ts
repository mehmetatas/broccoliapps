import { api } from "../lambda";
import { createValidationTest } from "../../shared/api-contracts";

api.register(createValidationTest, async (req, res) => {
  console.log(JSON.stringify(req, null, 2));
  return res.created({
    received: req,
    validatedAt: new Date().toISOString(),
  });
});
