import { PrivacyPage } from "../../client/pages/PrivacyPage";
import { page } from "../lambda";
import { render } from "../render";

page.handle("/privacy", async () => {
  return render(<PrivacyPage />, {
    title: "Privacy Policy - Serophin",
    headers: { "Cache-Control": "public, max-age=86400" },
    staticPage: true,
  });
});
