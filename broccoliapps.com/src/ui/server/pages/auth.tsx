import { globalConfig } from "@broccoliapps/shared";
import * as v from "valibot";
import { AuthPage } from "../../client/pages/AuthPage";
import { page } from "../lambda";
import { render } from "../render";

page
  .withRequest({
    app: v.picklist(Object.keys(globalConfig.apps)),
    provider: v.picklist(["google", "apple"]),
    platform: v.optional(v.picklist(["mobile"])),
  })
  .handle("/auth", async (req) => {
    return render(<AuthPage app={req.app} provider={req.provider} platform={req.platform} />, {
      title: "Sign In",
      skipLayout: true,
    });
  });
