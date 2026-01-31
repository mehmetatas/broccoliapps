import { emptySchema, type EmptyRequest, type Schema } from "@broccoliapps/shared";
import type { Context } from "hono";
import * as v from "valibot";
import { log } from "../log";
import { RequestContext } from "./context";
import { deserializeRequest } from "./deserializer";
import { handleError, HttpRouter, setCookies } from "./http-router";
import { PageResponse } from "./response";

/**
 * HTTP error that can be thrown from handlers to return a specific status code
 *
 * @example
 * throw new HttpError(401, "Unauthorized");
 * throw new HttpError(403, "Forbidden");
 * throw new HttpError(429, "Too Many Requests");
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Error information passed to custom error handlers
 */
export type PageError = {
  status: number;
  message: string;
  details?: string[];
};

/**
 * Custom error handler function type
 */
export type PageErrorHandler = (error: PageError, ctx: RequestContext) => Promise<PageResponse>;

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
 *   return render(<UsersListPage users={users} />, { title: "Users" });
 * });
 *
 * // Route with params
 * page.withRequest({ id: v.string() }).handle("/users/:id", async (req) => {
 *   return render(<UserDetailPage id={req.id} />, { title: "User" });
 * });
 */
export class PageRouter extends HttpRouter {
  private errorHandler?: PageErrorHandler;

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
   * Register a custom error handler for all page errors (validation, not found, server errors)
   */
  onError(fn: PageErrorHandler): this {
    this.errorHandler = fn;

    // Register Hono's notFound to use the same error handler
    this.hono.notFound(async (c) => {
      if (c.req.path.startsWith("/api")) {
        return c.json({ error: "Not Found" }, 404);
      }

      const notFoundError: PageError = {
        status: 404,
        message: "Page Not Found",
      };

      const ctx = new RequestContext(c);
      try {
        const response = await fn(notFoundError, ctx);
        setCookies(c, response.cookies);
        return c.html(response.html ?? "", 404, response.headers);
      } catch (handlerError) {
        log.err("Error handler failed:", { error: handlerError });
        return c.html("Not Found", 404);
      }
    });

    return this;
  }

  registerRoute<TReq>(path: string, schema: Schema<TReq>, fn: PageHandlerFn<TReq>): void {
    this.hono.get(path, async (c: Context): Promise<Response> => {
      try {
        const request = await deserializeRequest(c, "GET", schema);
        const ctx = new RequestContext(c);
        const response = await fn(request, ctx);

        setCookies(c, response.cookies);

        return c.html(response.html ?? "", response.status as 200, response.headers);
      } catch (error) {
        return this.handlePageError(c, error);
      }
    });
  }

  private async handlePageError(c: Context, error: unknown): Promise<Response> {
    if (!this.errorHandler) {
      return handleError(c, error);
    }

    const ctx = new RequestContext(c);
    let pageError: PageError;

    if (error instanceof v.ValiError) {
      pageError = {
        status: 400,
        message: "Validation Error",
        details: error.issues.map((issue) => {
          const path = issue.path?.map((p: { key: string | number }) => p.key).join(".") ?? "";
          return path ? `${path}: ${issue.message}` : issue.message;
        }),
      };
    } else if (error instanceof HttpError) {
      if (error.status >= 500) {
        log.err("Page error:", { path: c.req.path, status: error.status, error });
      } else {
        log.wrn("Page error:", { path: c.req.path, status: error.status, message: error.message });
      }
      pageError = {
        status: error.status,
        message: error.status >= 500 ? "Internal Server Error" : error.message,
      };
    } else {
      // Log the actual error for debugging, but don't expose to client
      log.err("Page error:", { path: c.req.path, status: 500, error });
      pageError = {
        status: 500,
        message: "Internal Server Error",
      };
    }

    try {
      const response = await this.errorHandler(pageError, ctx);
      setCookies(c, response.cookies);
      return c.html(response.html ?? "", pageError.status as 400, response.headers);
    } catch (handlerError) {
      log.err("Error handler failed:", { path: c.req.path, error: handlerError });
      return handleError(c, error);
    }
  }
}

/**
 * Builder with request schema - provides typed handle()
 */
class PageRouteWithRequest<TReq extends Record<string, unknown>> {
  constructor(
    private router: PageRouter,
    private schema: Schema<TReq>
  ) { }

  handle(path: string, fn: PageHandlerFn<TReq>): PageRouter {
    this.router.registerRoute(path, this.schema, fn);
    return this.router;
  }
}
