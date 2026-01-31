import { AboutPage } from "../../client/pages/AboutPage";
import { page } from "../lambda";
import { render } from "../render";

page.handle("/about", async () => {
  return render(<AboutPage />, {
    title: "About - Broccoli Apps",
    headers: { "Cache-Control": "public, max-age=86400" },
    staticPage: true,
  });
});
