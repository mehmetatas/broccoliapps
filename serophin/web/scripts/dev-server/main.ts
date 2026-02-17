import { serve } from "@broccoliapps/dev-tools";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { page } from "../../src/ui/server/lambda";

const staticApp = new Hono();
staticApp.use("/static/*", serveStatic({ root: "./" }));

serve({
  port: 8083,
  routes: {
    "/static/*": staticApp,
    "*": page,
  },
});
