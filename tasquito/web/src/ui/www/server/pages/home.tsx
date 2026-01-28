import { HomePage } from "../../client/pages/HomePage";
import { www } from "../lambda";
import { render } from "../render";

www.handle("/", async () => {
  return render(<HomePage />, {
    title: "Tasquito - Simple Task Management",
    headers: { "Cache-Control": "public, max-age=86400" },
  });
});
