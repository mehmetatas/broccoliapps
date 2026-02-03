import { type ApiContract, ApiError, type HttpMethod, type HttpResponse, type ResponseSchema, type Schema } from "@broccoliapps/shared";
import type { Context } from "hono";
import * as v from "valibot";
import { registerAuthHandlers, type UseAuthOptions } from "../auth/handlers";
import { log } from "../log";
import { registerPreferenceHandlers } from "../preferences";
import { RequestContext } from "./context";
import { deserializeRequest } from "./deserializer";
import { HttpRouter, setCookies } from "./http-router";
import { HttpError } from "./page-router";
import { type ApiResponse, createApiResponse } from "./response";
import { verifyS2SRequest } from "./s2s";
import { HttpHandler } from "./types";

/**
 * Standard API error response format
 */
type ApiErrorResponse = {
  status: number;
  message: string;
  details?: string[];
};

export class ApiRouter extends HttpRouter {
  /**
   * Register all standard auth handlers (exchange, refresh, magic link, Apple sign-in).
   * Auth config is auto-initialized from BA_APP_ID env var.
   */
  useAuth(options?: UseAuthOptions): this {
    registerAuthHandlers(this, options);
    return this;
  }

  /**
   * Register preference handlers (get all, set single).
   * Requires auth to be enabled.
   */
  usePreferences(): this {
    registerPreferenceHandlers(this);
    return this;
  }

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
    fn: (req: TReq, res: ApiResponse<TRes>, ctx: RequestContext) => Promise<HttpResponse<TRes>>,
  ): this {
    const res = createApiResponse<TRes>();
    this.registerRoute(contract.method, contract.path, contract.schema, contract.responseSchema, contract.isS2S, (req: TReq, ctx: RequestContext) =>
      fn(req, res, ctx),
    );
    return this;
  }

  private registerRoute<TReq, TRes>(
    method: HttpMethod,
    path: string,
    schema: Schema<TReq>,
    responseSchema: ResponseSchema<TRes> | undefined,
    isS2S: boolean,
    handler: HttpHandler<TReq, TRes>,
  ): void {
    const honoHandler = async (c: Context): Promise<Response> => {
      try {
        let preReadBody: string | undefined;
        if (isS2S) {
          const appId = c.req.header("x-ba-app");
          const timestamp = c.req.header("x-ba-request-timestamp");
          const signature = c.req.header("x-ba-signature");
          if (!appId || !timestamp || !signature) {
            throw new HttpError(401, "Missing S2S headers");
          }
          if (method !== "GET" && method !== "DELETE") {
            preReadBody = await c.req.text();
          }
          verifyS2SRequest(appId, timestamp, signature, path, preReadBody);
        }

        const request = await deserializeRequest(c, method, schema, preReadBody);
        const ctx = new RequestContext(c);
        const response = await handler(request, ctx);
        setCookies(c, response.cookies);

        const status = response.status ?? 200;
        if (status === 204) {
          return c.body(null, 204, response.headers);
        }

        // Strip extra fields if response schema is defined
        let data = response.data;
        if (responseSchema && data !== undefined) {
          data = v.parse(responseSchema, data);
        }

        return c.json(data, status as 200, response.headers);
      } catch (error) {
        return this.handleApiError(c, error);
      }
    };

    this.hono[method.toLowerCase() as Lowercase<HttpMethod>](path, honoHandler);
  }

  private handleApiError(c: Context, error: unknown): Response {
    let apiError: ApiErrorResponse;

    if (error instanceof v.ValiError) {
      apiError = {
        status: 400,
        message: "Validation Error",
        details: error.issues.map((issue) => {
          const path = issue.path?.map((p: { key: string | number }) => p.key).join(".") ?? "";
          return path ? `${path}: ${issue.message}` : issue.message;
        }),
      };
    } else if (error instanceof ApiError) {
      log.wrn("Upstream API error:", { path: c.req.path, status: error.status, message: error.message });
      apiError = { status: error.status, message: error.message, details: error.details };
    } else if (error instanceof HttpError) {
      if (error.status >= 500) {
        log.err("API error:", { path: c.req.path, status: error.status, error });
      } else {
        log.wrn("API error:", { path: c.req.path, status: error.status, message: error.message });
      }
      apiError = {
        status: error.status,
        message: error.status >= 500 ? "Internal Server Error" : error.message,
      };
    } else {
      log.err("API error:", { path: c.req.path, status: 500, error });
      apiError = {
        status: 500,
        message: "Internal Server Error",
      };
    }

    return c.json(apiError, apiError.status as 400);
  }
}
