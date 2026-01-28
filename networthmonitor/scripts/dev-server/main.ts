import { serve } from "@broccoliapps/dev-tools";
import { api } from "../../src/api/lambda";
import { www } from "../../src/ui/www/server/lambda";

serve({
  port: 8081,
  routes: {
    "/api/*": api,
    "*": www,
  },
});
