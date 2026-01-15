import * as v from "valibot";
import { AuthPage } from "../../client/pages/AuthPage";
import { page } from "../lambda";
import { render } from "../page-response";

page
  .withRequest({
    app: v.picklist(["expense-tracker"]),
    provider: v.picklist(["google"]),
  })
  .handle("/auth", async (req) => {
    return render(<AuthPage app={req.app} provider={req.provider} />).withOptions({
      title: "Sign In",
      skipLayout: true,
    });
  });
