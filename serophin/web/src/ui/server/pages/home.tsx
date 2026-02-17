import { HomePage } from "../../client/pages/HomePage";
import { page } from "../lambda";
import { render } from "../render";

page.handle("/", async () => {
  return render(<HomePage />, {
    title: "Serophin - Meditation & Mindfulness",
    headers: { "Cache-Control": "public, max-age=86400" },
    staticPage: true,
  });
});
