export * from "./build";
export * from "./dependency-verification";

import { serve as honoServe } from "@hono/node-server";
import { Hono } from "hono";

type Router = {
  fetch: (request: Request) => Response | Promise<Response>;
};

type ServeOptions = {
  port: number;
  routes: Record<string, Router>;
};

export const serve = (options: ServeOptions): void => {
  const app = new Hono();

  // Sort routes: specific patterns first, catch-all "*" last
  const sortedRoutes = Object.entries(options.routes).sort(([a], [b]) => {
    if (a === "*") {
      return 1;
    }
    if (b === "*") {
      return -1;
    }
    return b.length - a.length; // longer patterns first
  });

  for (const [pattern, router] of sortedRoutes) {
    app.all(pattern, (c) => router.fetch(c.req.raw));
  }

  console.log(`Server running at http://localhost:${options.port}`);
  honoServe({ fetch: app.fetch, port: options.port });
};
