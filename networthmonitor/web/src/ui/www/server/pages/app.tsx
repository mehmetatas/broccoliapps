import renderToString from "preact-render-to-string";
import { AppHtml } from "../../client/layout/AppHtml";
import { www } from "../lambda";

www.handle("/app/*", async () => ({
  html: renderToString(<AppHtml />),
}));