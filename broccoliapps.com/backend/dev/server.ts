import { serve } from "@hono/node-server";
import { app } from "../src/example/app";

// Import handlers - they self-register to the app
import "../src/example/api/handlers";
import "../src/example/ui/pages/handlers";

const port = 3000;
console.log(`Server running at http://localhost:${port}`);

serve({ fetch: app.fetch, port });
