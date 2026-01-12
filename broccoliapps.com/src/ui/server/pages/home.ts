import { HomePage } from "../../client";
import { page } from "../lambda";

page.route("/", HomePage).handler(async (_req, res) => {
  return res.render(
    {
      title: "Welcome to BroccoliApps",
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
});
