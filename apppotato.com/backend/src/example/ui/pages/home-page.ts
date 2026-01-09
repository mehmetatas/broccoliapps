import { homePage } from "../contracts";
import { app } from "../../app";

app.page(homePage, async (_req, res) => {
  return res.render({
    title: "Welcome to AppPotato",
  });
});
