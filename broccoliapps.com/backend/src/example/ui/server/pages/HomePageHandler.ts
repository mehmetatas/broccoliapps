import { app } from "../../../app";
import { homePage } from "../contracts";

app.page(homePage, async (_req, res) => {
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
