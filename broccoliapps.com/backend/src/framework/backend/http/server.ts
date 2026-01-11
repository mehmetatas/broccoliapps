import type { FullContract, HttpResponse } from "../../shared";
import { createResponseHelpers, type RequestContext, type ResponseHelpers } from "./helpers";
import type { ApiRoute } from "./route";

// Handler function type with response helpers
type ImplFn<TReq, TRes> = (
  request: TReq,
  res: ResponseHelpers<TRes>,
  ctx: RequestContext
) => Promise<HttpResponse<TRes>>;

/**
 * Create a route handler from a contract
 *
 * @example
 * app.route(impl(createUser, async (req, res) => {
 *   return res.created({ created: true, name: req.name });
 * }));
 */
export const impl = <TReq extends Record<string, unknown>, TRes>(
  contract: FullContract<TReq, TRes>,
  fn: ImplFn<TReq, TRes>
): ApiRoute<TReq, TRes> => {
  const helpers = createResponseHelpers<TRes>();
  return {
    type: "api",
    method: contract.method,
    path: contract.path,
    schema: contract.schema,
    fn: (request: TReq, ctx: RequestContext) => fn(request, helpers, ctx),
  };
};
