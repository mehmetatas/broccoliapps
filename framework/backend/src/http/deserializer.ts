import type { HttpMethod } from "@broccoliapps/shared";
import type { Context } from "hono";
import * as v from "valibot";

/**
 * Merge request data from appropriate sources based on HTTP method.
 * - GET/DELETE: query params + path params (path takes precedence)
 * - POST/PUT/PATCH: body + path params (path takes precedence)
 */
const mergeRequestData = async (c: Context, method: HttpMethod, preReadBody?: string): Promise<Record<string, unknown>> => {
  const pathParams = c.req.param() as Record<string, string>;

  if (method === "GET" || method === "DELETE") {
    const queryParams = c.req.query() as Record<string, string>;
    // Query first, then path params override
    return { ...queryParams, ...pathParams };
  }

  // POST, PUT, PATCH - body + path params
  let body: Record<string, unknown> = {};
  try {
    body = preReadBody !== undefined ? JSON.parse(preReadBody) : await c.req.json();
  } catch {
    // Empty body is valid for some requests
  }

  // Body first, then path params override
  return { ...body, ...pathParams };
};

/**
 * Deserialize and validate request data using a Valibot schema
 */
export const deserializeRequest = async <T>(
  c: Context,
  method: HttpMethod,
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
  preReadBody?: string,
): Promise<T> => {
  const data = await mergeRequestData(c, method, preReadBody);
  return v.parse(schema, data);
};
