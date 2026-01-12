import * as v from "valibot";
import type { HttpMethod, Schema } from "./types";

// API Error class for client-side error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Empty schema for contracts without request body
export const emptySchema = v.object({});
export type EmptyRequest = v.InferOutput<typeof emptySchema>;

// Invoke options
export type InvokeOptions = {
  baseUrl?: string;
};

// Global base URL for invoke
let globalBaseUrl = "";
export const setBaseUrl = (url: string): void => {
  globalBaseUrl = url;
};

// Extract path param names from path (e.g., "/users/:id" -> ["id"])
const extractPathParams = (path: string): string[] => {
  const matches = path.match(/:([^/]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
};

// API contract with invoke method
export class ApiContract<TReq extends Record<string, unknown>, TRes> {
  readonly _response!: TRes; // phantom type for type inference

  constructor(
    public readonly method: HttpMethod,
    public readonly path: string,
    public readonly schema: Schema<TReq>
  ) {}

  /**
   * Invoke this API contract
   *
   * @example
   * const user = await createUser.invoke({
   *   name: "John",
   *   email: "john@example.com"
   * });
   */
  async invoke(request: TReq, options?: InvokeOptions): Promise<TRes> {
    const pathParams = extractPathParams(this.path);
    let url = (options?.baseUrl ?? globalBaseUrl) + this.path;
    const remaining = { ...request };

    // Replace path params in URL
    for (const param of pathParams) {
      if (param in remaining) {
        url = url.replace(`:${param}`, String(remaining[param]));
        delete remaining[param];
      }
    }

    const hasBody = this.method !== "GET" && this.method !== "DELETE";

    // GET or DELETE: remaining goes to query string
    if (!hasBody) {
      const entries = Object.entries(remaining).filter(([, val]) => val !== undefined);
      if (entries.length > 0) {
        const qs = new URLSearchParams(entries.map(([k, val]) => [k, String(val)]));
        url += "?" + qs.toString();
      }
    }

    const response = await fetch(url, {
      method: this.method,
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(remaining) : undefined,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(response.status, err.code ?? "UNKNOWN", err.message ?? "Request failed");
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as TRes;
    }

    return response.json();
  }
}

// Builder: after .withRequest() - IS a contract (defaults to void), can add .withResponse<T>()
export class ContractWithRequest<TReq extends Record<string, unknown>> extends ApiContract<TReq, void> {
  withResponse<TRes>(): ApiContract<TReq, TRes> {
    return new ApiContract<TReq, TRes>(this.method, this.path, this.schema);
  }
}

// Builder: initial state - IS a contract (defaults to void), can add .withRequest() or .withResponse<T>()
export class ContractBuilder extends ApiContract<EmptyRequest, void> {
  constructor(method: HttpMethod, path: string) {
    super(method, path, emptySchema);
  }

  withRequest<TReq extends v.ObjectEntries>(
    entries: TReq
  ): ContractWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>> {
    const schema = v.object(entries);
    return new ContractWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>>(this.method, this.path, schema);
  }

  withResponse<TRes>(): ApiContract<EmptyRequest, TRes> {
    return new ApiContract<EmptyRequest, TRes>(this.method, this.path, emptySchema);
  }
}

// API contract - auto-adds /api prefix
export const api = (method: HttpMethod, path: string): ContractBuilder => new ContractBuilder(method, `/api${path}`);
