import type { Context } from "hono";
import { render } from "preact-render-to-string";
import type { HttpResponse, Schema } from "../../../shared";
import { RequestContext } from "../context";
import { deserializeRequest } from "../deserializer";
import { handleError, HttpRouter, setCookies } from "../router";
import { HttpHandler } from "../types";
import type { PageContract } from "./contract";
import { createPageResponse, type PageResponse } from "./response";
import type { PageComponent } from "./types";

export class PageRouter extends HttpRouter {
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
   * Register a page contract with its implementation
   *
   * @example
   * page.register(listUsersPage, async (req, res) => {
   *   return res.render({ users: [...] });
   * });
   */
  register<TReq extends Record<string, unknown>, TProps>(
    contract: PageContract<TReq, TProps>,
    fn: (req: TReq, res: PageResponse<TProps>, ctx: RequestContext) => Promise<HttpResponse<TProps>>
  ): this {
    const res = createPageResponse<TProps>();
    this.registerPage(contract.path, contract.schema, contract.Component, (req: TReq, ctx: RequestContext) =>
      fn(req, res, ctx)
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
}
