import type { Context } from "hono";
import type { ApiContract, HttpMethod, HttpResponse, Schema } from "../../../shared";
import { RequestContext } from "../context";
import { deserializeRequest } from "../deserializer";
import { handleError, HttpRouter, setCookies } from "../router";
import { HttpHandler } from "../types";
import { createApiResponse, type ApiResponse } from "./response";

export class ApiRouter extends HttpRouter {
  /**
   * Register an API contract with its implementation
   *
   * @example
   * api.register(createUser, async (req, res) => {
   *   return res.created({ id: 1, name: req.name });
   * });
   */
  register<TReq extends Record<string, unknown>, TRes>(
    contract: ApiContract<TReq, TRes>,
    fn: (req: TReq, res: ApiResponse<TRes>, ctx: RequestContext) => Promise<HttpResponse<TRes>>
  ): this {
    const res = createApiResponse<TRes>();
    this.registerRoute(contract.method, contract.path, contract.schema, (req: TReq, ctx: RequestContext) =>
      fn(req, res, ctx)
    );
    return this;
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
        setCookies(c, response.cookies);

        const status = response.status ?? 200;
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
}
