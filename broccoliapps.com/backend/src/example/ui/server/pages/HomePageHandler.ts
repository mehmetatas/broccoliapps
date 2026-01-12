import { page } from "../lambda";
import { homePage } from "./contracts";

page.register(homePage, async (_req, res) => {
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
