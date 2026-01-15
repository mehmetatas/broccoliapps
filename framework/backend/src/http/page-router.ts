import { emptySchema, type EmptyRequest, type Schema } from "@broccoliapps/shared";
import type { Context } from "hono";
import * as v from "valibot";
import { RequestContext } from "./context";
import { deserializeRequest } from "./deserializer";
import { handleError, HttpRouter, setCookies } from "./http-router";
import { PageResponse } from "./response";

/**
 * Handler function type
 */
export type PageHandlerFn<TRequest> = (request: TRequest, ctx: RequestContext) => Promise<PageResponse>;

/**
 * Router for page routes.
 *
 * @example
 * // Simple route (no params)
 * page.handle("/users", async () => {
 *   return render(<UsersListPage users={users} />).withOptions({ title: "Users" });
 * });
 *
 * // Route with params
 * page.withRequest({ id: v.string() }).handle("/users/:id", async (req) => {
 *   return render(<UserDetailPage id={req.id} />).withOptions({ title: "User" });
 * });
 */
export class PageRouter extends HttpRouter {
  /**
   * Define request schema for typed params
   */
  withRequest<TReq extends v.ObjectEntries>(
    entries: TReq
  ): PageRouteWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>> {
    const schema = v.object(entries);
    return new PageRouteWithRequest(this, schema);
  }

  /**
   * Register a route handler (no params)
   */
  handle(path: string, fn: PageHandlerFn<EmptyRequest>): this {
    this.registerRoute(path, emptySchema, fn);
    return this;
  }

  /**
   * Register a 404 not found handler
   */
  notFound(fn: PageHandlerFn<EmptyRequest>): this {
    this.hono.notFound(async (c) => {
      if (c.req.path.startsWith("/api")) {
        return c.json({ error: "Not Found" }, 404);
      }

      const ctx = new RequestContext(c);
      const response = await fn({}, ctx);
      return c.html(response.data, 404);
    });
    return this;
  }

  private registerRoute<TReq>(path: string, schema: Schema<TReq>, fn: PageHandlerFn<TReq>): void {
    this.hono.get(path, async (c: Context): Promise<Response> => {
      try {
        const request = await deserializeRequest(c, "GET", schema);
        const ctx = new RequestContext(c);
        const response = await fn(request, ctx);

        setCookies(c, response.cookies);

        return c.html(response.data, response.status as 200, response.headers);
      } catch (error) {
        return handleError(c, error);
      }
    });
  }
}

/**
 * Builder with request schema - provides typed handle()
 */
class PageRouteWithRequest<TReq extends Record<string, unknown>> {
  constructor(
    private router: PageRouter,
    private schema: Schema<TReq>
  ) {}

  handle(path: string, fn: PageHandlerFn<TReq>): PageRouter {
    this.router["registerRoute"](path, this.schema, fn);
    return this.router;
  }
}
