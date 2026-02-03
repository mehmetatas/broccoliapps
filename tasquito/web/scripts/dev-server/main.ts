import { serve } from "@broccoliapps/dev-tools";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { api } from "../../src/api/lambda";
import { www } from "../../src/ui/www/server/lambda";

const staticApp = new Hono();
staticApp.use("/static/*", serveStatic({ root: "./" }));

serve({
  port: 8082,
  routes: {
    "/api/*": api,
    "/static/*": staticApp,
    "*": www,
  },
});
