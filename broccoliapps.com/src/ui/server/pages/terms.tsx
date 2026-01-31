import { TermsPage } from "../../client/pages/TermsPage";
import { page } from "../lambda";
import { render } from "../render";

page.handle("/terms", async () => {
  return render(<TermsPage />, {
    title: "Terms of Service - Broccoli Apps",
    headers: { "Cache-Control": "public, max-age=86400" },
    staticPage: true,
  });
});
