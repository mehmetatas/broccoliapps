import type { Context } from "hono";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { render } from "preact-render-to-string";
import * as v from "valibot";
import type { Cookie, FullContract, HttpMethod, HttpResponse, Schema } from "../../shared";
import { deserializeRequest } from "./deserializer";
import type { PageContract } from "./page-contract";
import type { PageComponent } from "./page-types";
import {
  createPageResponseHelpers,
  createResponseHelpers,
  RequestContext,
  type PageResponseHelpers,
  type ResponseHelpers,
} from "./helpers";
import { type Route } from "./route";
import type { HttpHandler } from "./types";

const setCookies = (c: Context, cookies?: Cookie[]): void => {
  if (!cookies) {return;}
  for (const cookie of cookies) {
    c.header(
      "Set-Cookie",
      `${cookie.name}=${cookie.value}` +
        (cookie.maxAge !== undefined ? `; Max-Age=${cookie.maxAge}` : "") +
        (cookie.path ? `; Path=${cookie.path}` : "") +
        (cookie.domain ? `; Domain=${cookie.domain}` : "") +
        (cookie.secure ? "; Secure" : "") +
        (cookie.httpOnly ? "; HttpOnly" : "") +
        (cookie.sameSite ? `; SameSite=${cookie.sameSite}` : ""),
      { append: true }
    );
  }
};

const handleError = (c: Context, error: unknown): Response => {
  if (error instanceof v.ValiError) {
    return c.json(
      {
        error: "Validation Error",
        issues: error.issues.map((issue) => ({
          path: issue.path?.map((p: { key: string | number }) => p.key).join("."),
          message: issue.message,
        })),
      },
      400
    );
  }

  if (error instanceof Error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ error: "Unknown error" }, 500);
};

export class HttpRouter {
  private hono: Hono;

  constructor() {
    this.hono = new Hono();
  }

  /**
   * Hono fetch handler for Lambda/dev server
   */
  get fetch() {
    return this.hono.fetch.bind(this.hono);
  }

  /**
   * Register a 404 not found handler
   */
  notFound(Component: PageComponent<object>): this {
    this.hono.notFound((c) => {
      if (c.req.path.startsWith("/api")) {
        return c.json({ error: "Not Found" }, 404);
      }
      const html = "<!DOCTYPE html>" + render(Component({}));
      return c.html(html, 404);
    });
    return this;
  }

  /**
   * Register a route from the fluent builder API
   */
  route(route: Route): this {
    if (route.type === "api") {
      this.registerRoute(route.method, route.path, route.schema, route.fn);
    } else {
      this.registerPage(route.path, route.schema, route.Component, route.fn);
    }
    return this;
  }

  /**
   * Register an API contract with its implementation
   *
   * @example
   * app.api(createUser, async (req, res) => {
   *   return res.created({ id: 1, name: req.name });
   * });
   */
  api<TReq extends Record<string, unknown>, TRes>(
    contract: FullContract<TReq, TRes>,
    fn: (req: TReq, res: ResponseHelpers<TRes>, ctx: RequestContext) => Promise<HttpResponse<TRes>>
  ): this {
    const helpers = createResponseHelpers<TRes>();
    this.registerRoute(contract.method, contract.path, contract.schema, (req: TReq, ctx: RequestContext) =>
      fn(req, helpers, ctx)
    );
    return this;
  }

  /**
   * Register a page contract with its implementation
   *
   * @example
   * app.page(listUsersPage, async (req, res) => {
   *   return res.render({ users: [...] });
   * });
   */
  page<TReq extends Record<string, unknown>, TProps>(
    contract: PageContract<TReq, TProps>,
    fn: (req: TReq, res: PageResponseHelpers<TProps>, ctx: RequestContext) => Promise<HttpResponse<TProps>>
  ): this {
    const helpers = createPageResponseHelpers<TProps>();
    this.registerPage(contract.path, contract.schema, contract.Component, (req: TReq, ctx: RequestContext) =>
      fn(req, helpers, ctx)
    );
    return this;
  }

  private registerPage<TReq, TProps>(
    path: string,
    schema: Schema<TReq>,
    Component: PageComponent<TProps>,
    handler: HttpHandler<TReq, TProps>
  ): void {
    this.hono.get(path, async (c: Context): Promise<Response> => {
      try {
        const request = await deserializeRequest(c, "GET", schema);
        const ctx = new RequestContext(c);
        const response = await handler(request, ctx);
        setCookies(c, response.cookies);
        const html = "<!DOCTYPE html>" + render(Component(response.data));
        return c.html(html, (response.status ?? 200) as 200, response.headers);
      } catch (error) {
        return handleError(c, error);
      }
    });
  }

  private registerRoute<TReq, TRes>(
    method: HttpMethod,
    path: string,
    schema: Schema<TReq>,
    handler: HttpHandler<TReq, TRes>
  ): void {
    const honoHandler = async (c: Context): Promise<Response> => {
      try {
        const request = await deserializeRequest(c, method, schema);
        const ctx = new RequestContext(c);
        const response = await handler(request, ctx);
        const status = response.status ?? 200;
        setCookies(c, response.cookies);

        if (status === 204) {
          return c.body(null, 204, response.headers);
        }

        return c.json(response.data, status as 200, response.headers);
      } catch (error) {
        return handleError(c, error);
      }
    };

    this.hono[method.toLowerCase() as Lowercase<HttpMethod>](path, honoHandler);
  }

  /**
   * Creates the Lambda handler
   */
  lambdaHandler() {
    return handle(this.hono);
  }
}
