import type { HttpResponse } from "../../shared";
import type { RequestContext } from "./helpers/context";

// Backend-specific type - depends on RequestContext which is backend-only
export type HttpHandler<TReq, TRes> = (
  request: TReq,
  ctx: RequestContext
) => Promise<HttpResponse<TRes>>;
