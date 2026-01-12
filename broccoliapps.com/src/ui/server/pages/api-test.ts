import { ApiTestPage } from "../../client";
import { page } from "../lambda";

page.route("/api-test", ApiTestPage).handler(async (_req, res) => {
  return res.render({});
});
