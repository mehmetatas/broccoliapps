import { serve } from "@hono/node-server";
import { Hono } from "hono";

// Import routers (handlers self-register during import)
import { api } from "../../src/example/api/lambda";
import { page } from "../../src/example/ui/server/lambda";

// Combine both routers for local development
const app = new Hono();

// Mount API routes
app.all("/api/*", (c) => api.fetch(c.req.raw));
app.all("/health/*", (c) => api.fetch(c.req.raw));

// Mount page routes (catch-all)
app.all("*", (c) => page.fetch(c.req.raw));

const port = 3000;
console.log(`Server running at http://localhost:${port}`);

serve({ fetch: app.fetch, port });
