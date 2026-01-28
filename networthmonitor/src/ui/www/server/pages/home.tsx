import { HomePage } from "../../client/pages/HomePage";
import { www } from "../lambda";
import { render } from "../render";

www.handle("/", async () => {
  return render(<HomePage />, {
    title: "Net Worth Monitor",
    headers: { "Cache-Control": "public, max-age=86400" },
  });
});
