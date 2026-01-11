import { app } from "../../app";
import { createValidationTest } from "../../shared/api-contracts";

app.api(createValidationTest, async (req, res) => {
  return res.created({
    received: req,
    validatedAt: new Date().toISOString(),
  });
});
