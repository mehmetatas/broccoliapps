import type { HttpResponse, Schema } from "@broccoliapps/framework-shared";
import { emptySchema, type EmptyRequest } from "@broccoliapps/framework-shared/contract";
import type { Context } from "hono";
import { render } from "preact-render-to-string";
import * as v from "valibot";
import { RequestContext } from "../context";
import { deserializeRequest } from "../deserializer";
import { handleError, HttpRouter, setCookies } from "../router";
import { HttpHandler } from "../types";
import { createPageResponse, type PageResponse } from "./response";
import type { PageComponent } from "./types";

// Builder: after .withRequest() - must chain .handler()
export class PageRouteBuilderWithRequest<TReq extends Record<string, unknown>, TProps> {
  constructor(
    protected router: PageRouter,
    protected path: string,
    protected Component: PageComponent<TProps>,
    protected schema: Schema<TReq>
  ) {}

  handler(
    fn: (req: TReq, res: PageResponse<TProps>, ctx: RequestContext) => Promise<HttpResponse<TProps>>
  ): PageRouter {
    const res = createPageResponse<TProps>();
    this.router["registerPage"](this.path, this.schema, this.Component, (req: TReq, ctx: RequestContext) =>
      fn(req, res, ctx)
    );
    return this.router;
  }
}

// Builder: after .route() - can chain .withRequest() or .handler()
export class PageRouteBuilder<TProps> extends PageRouteBuilderWithRequest<EmptyRequest, TProps> {
  constructor(router: PageRouter, path: string, Component: PageComponent<TProps>) {
    super(router, path, Component, emptySchema);
  }

  withRequest<TReq extends v.ObjectEntries>(
    entries: TReq
  ): PageRouteBuilderWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>, TProps> {
    const schema = v.object(entries);
    return new PageRouteBuilderWithRequest(this.router, this.path, this.Component, schema);
  }
}

export class PageRouter extends HttpRouter {
  /**
   * Start building a page route
   *
   * @example
   * page.route("/", HomePage)
   *   .handler(async (_req, res) => res.render({ title: "Home" }));
   *
   * @example
   * page.route("/users/:id", UserDetailPage)
   *   .withRequest({ id: v.pipe(v.string(), v.minLength(1)) })
   *   .handler(async (req, res) => res.render({ id: req.id, name: "Alice" }));
   */
  route<TProps>(path: string, Component: PageComponent<TProps>): PageRouteBuilder<TProps> {
    return new PageRouteBuilder(this, path, Component);
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
