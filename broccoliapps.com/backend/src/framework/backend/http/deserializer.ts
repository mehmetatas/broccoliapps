import type { Context } from "hono";
import * as v from "valibot";
import type { HttpMethod } from "../../shared";

/**
 * Merge request data from appropriate sources based on HTTP method.
 * - GET/DELETE: query params + path params (path takes precedence)
 * - POST/PUT/PATCH: body + path params (path takes precedence)
 */
const mergeRequestData = async (c: Context, method: HttpMethod): Promise<Record<string, unknown>> => {
  const pathParams = c.req.param() as Record<string, string>;

  if (method === "GET" || method === "DELETE") {
    const queryParams = c.req.query() as Record<string, string>;
    // Query first, then path params override
    return { ...queryParams, ...pathParams };
  }

  // POST, PUT, PATCH - body + path params
  let body: Record<string, unknown> = {};
  try {
    body = await c.req.json();
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
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>
): Promise<T> => {
  const data = await mergeRequestData(c, method);
  return v.parse(schema, data);
};
