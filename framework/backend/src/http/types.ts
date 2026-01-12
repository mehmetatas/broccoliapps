import type { HttpResponse } from "@broccoliapps/framework-shared";
import type { RequestContext } from "./context";

// Backend-specific type - depends on RequestContext which is backend-only
export type HttpHandler<TReq, TRes> = (request: TReq, ctx: RequestContext) => Promise<HttpResponse<TRes>>;
