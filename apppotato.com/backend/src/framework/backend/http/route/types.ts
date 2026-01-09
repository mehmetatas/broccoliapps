import type { HttpMethod, HttpResponse, Schema } from "../../../shared";
import type { PageResponseHelpers, RequestContext, ResponseHelpers } from "../helpers";
import type { PageComponent } from "../page-types";

// Handler function type with response helpers
export type ImplFnType<TReq, TRes> = (
  request: TReq,
  res: ResponseHelpers<TRes>,
  ctx: RequestContext
) => Promise<HttpResponse<TRes>>;

// Handler function type (internal - still uses raw handler signature)
export type HandlerFnType<TReq, TRes> = (request: TReq, ctx: RequestContext) => Promise<HttpResponse<TRes>>;

// Page handler function type with response helpers
export type PageImplFnType<TReq, TProps> = (
  request: TReq,
  res: PageResponseHelpers<TProps>,
  ctx: RequestContext
) => Promise<HttpResponse<TProps>>;

// Route types for app.route()
export type ApiRoute<TReq, TRes> = {
  type: "api";
  method: HttpMethod;
  path: string;
  schema: Schema<TReq>;
  fn: HandlerFnType<TReq, TRes>;
};

export type PageRoute<TReq, TProps> = {
  type: "page";
  path: string;
  schema: Schema<TReq>;
  Component: PageComponent<TProps>;
  fn: HandlerFnType<TReq, TProps>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Route = ApiRoute<any, any> | PageRoute<any, any>;
