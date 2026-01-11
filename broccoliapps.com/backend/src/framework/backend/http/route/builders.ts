import type { HttpMethod, Schema } from "../../../shared";
import { createPageResponseHelpers, createResponseHelpers, type RequestContext } from "../helpers";
import type { PageComponent } from "../page-types";
import type { ApiRoute, ImplFnType, PageImplFnType, PageRoute } from "./types";

// Builder: after .request(schema)
class RouteWithRequest<TReq> {
  constructor(
    private method: HttpMethod,
    private path: string,
    private schema: Schema<TReq>
  ) {}

  response<TRes>(): RouteWithResponse<TReq, TRes> {
    return new RouteWithResponse(this.method, this.path, this.schema);
  }

  render<TProps>(Component: PageComponent<TProps>): RouteWithRender<TReq, TProps> {
    return new RouteWithRender(this.path, this.schema, Component);
  }
}

// Builder: after .response<T>()
class RouteWithResponse<TReq, TRes> {
  constructor(
    private method: HttpMethod,
    private path: string,
    private schema: Schema<TReq>
  ) {}

  impl(fn: ImplFnType<TReq, TRes>): ApiRoute<TReq, TRes> {
    const helpers = createResponseHelpers<TRes>();
    return {
      type: "api",
      method: this.method,
      path: this.path,
      schema: this.schema,
      fn: (request: TReq, ctx: RequestContext) => fn(request, helpers, ctx),
    };
  }
}

// Builder: after .render(Component)
class RouteWithRender<TReq, TProps> {
  constructor(
    private path: string,
    private schema: Schema<TReq>,
    private Component: PageComponent<TProps>
  ) {}

  impl(fn: PageImplFnType<TReq, TProps>): PageRoute<TReq, TProps> {
    const helpers = createPageResponseHelpers<TProps>();
    return {
      type: "page",
      path: this.path,
      schema: this.schema,
      Component: this.Component,
      fn: (request: TReq, ctx: RequestContext) => fn(request, helpers, ctx),
    };
  }
}

// Builder: captures response type first, then schema
class RouteWithReturns<TRes> {
  constructor(
    private method: HttpMethod,
    private path: string
  ) {}

  schema<TReq>(schema: Schema<TReq>): RouteWithResponse<TReq, TRes> {
    return new RouteWithResponse(this.method, this.path, schema);
  }
}

// Builder: initial state after get/post/etc (no schema yet)
class RouteBuilder {
  constructor(
    private method: HttpMethod,
    private path: string
  ) {}

  // API: .returns<TRes>().schema(s) - response type first, then infer request from schema
  returns<TRes>(): RouteWithReturns<TRes> {
    return new RouteWithReturns(this.method, this.path);
  }

  // Page: .request(schema).render(Component)
  request<TReq>(schema: Schema<TReq>): RouteWithRequest<TReq> {
    return new RouteWithRequest(this.method, this.path, schema);
  }
}

// Builder: schema provided upfront via post("/path", schema)
class RouteBuilderWithSchema<TReq> {
  constructor(
    private method: HttpMethod,
    private path: string,
    private schema: Schema<TReq>
  ) {}

  // API: .returns<TRes>().impl(...)
  returns<TRes>(): RouteWithResponse<TReq, TRes> {
    return new RouteWithResponse(this.method, this.path, this.schema);
  }

  // Page: .render(Component).impl(...)
  render<TProps>(Component: PageComponent<TProps>): RouteWithRender<TReq, TProps> {
    return new RouteWithRender(this.path, this.schema, Component);
  }
}

// Interface for overloaded HTTP method functions
interface HttpMethodFn {
  (path: string): RouteBuilder;
  <TReq>(path: string, schema: Schema<TReq>): RouteBuilderWithSchema<TReq>;
}

// Factory to create HTTP method functions
const createHttpMethodFn = (method: HttpMethod): HttpMethodFn =>
  (<TReq>(path: string, schema?: Schema<TReq>): RouteBuilder | RouteBuilderWithSchema<TReq> =>
    schema ? new RouteBuilderWithSchema(method, path, schema) : new RouteBuilder(method, path)) as HttpMethodFn;

// Entry points for inline route definitions (without full contracts)
export const get: HttpMethodFn = createHttpMethodFn("GET");
export const post: HttpMethodFn = createHttpMethodFn("POST");
export const put: HttpMethodFn = createHttpMethodFn("PUT");
export const patch: HttpMethodFn = createHttpMethodFn("PATCH");
export const del: HttpMethodFn = createHttpMethodFn("DELETE");
