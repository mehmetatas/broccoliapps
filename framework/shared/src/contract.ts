import { sha256 as jsSha256 } from "js-sha256";
import * as v from "valibot";
import type { HttpMethod, Schema } from "./types";

// API Error class for client-side error handling
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: string[],
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
  skipAuth?: boolean;
};

// Global base URL for invoke
let globalBaseUrl = "";
export const setBaseUrl = (url: string): void => {
  globalBaseUrl = url;
};

// Global access token getter for authenticated requests
type TokenProvider = {
  get: () => Promise<string | undefined>;
};
let tokenProvider: TokenProvider = { get: () => Promise.resolve(undefined) };
export const setTokenProvider = (provider: TokenProvider): void => {
  tokenProvider = provider;
};

// Global S2S provider for server-to-server authentication
type S2SProvider = { appId: string; sign: (hash: string) => Promise<string> };
let s2sProvider: S2SProvider | undefined;
export const setS2SProvider = (provider: S2SProvider): void => {
  s2sProvider = provider;
};

// Extract path param names from path (e.g., "/users/:id" -> ["id"])
const extractPathParams = (path: string): string[] => {
  const matches = path.match(/:([^/]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
};

// SHA256 hash for request body (required by CloudFront with IAM auth)
// Uses Web Crypto API when available (browser), falls back to js-sha256 (React Native)
const sha256 = async (message: string): Promise<string> => {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return jsSha256(message);
};

// Response schema type alias for cleaner signatures
export type ResponseSchema<TRes> = v.BaseSchema<unknown, TRes, v.BaseIssue<unknown>>;

// API contract with invoke method
export class ApiContract<TReq extends Record<string, unknown>, TRes> {
  readonly _response!: TRes; // phantom type for type inference

  constructor(
    public readonly method: HttpMethod,
    public readonly path: string,
    public readonly schema: Schema<TReq>,
    public readonly responseSchema?: ResponseSchema<TRes>,
    public readonly isS2S: boolean = false,
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
  async invoke(request?: TReq, options?: InvokeOptions): Promise<TRes> {
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

    // Build headers
    const headers: Record<string, string> = {};
    let body: string | undefined;

    if (hasBody) {
      body = JSON.stringify(remaining);
      headers["Content-Type"] = "application/json";
      // SHA256 hash required by CloudFront with IAM auth for POST/PUT
      headers["x-amz-content-sha256"] = await sha256(body);
    }

    // Auth: S2S signing OR access token (mutually exclusive)
    if (this.isS2S) {
      if (!s2sProvider) {
        throw new ApiError(500, "S2S provider not configured");
      }

      const timestamp = String(Date.now());
      const payload: Record<string, string> = { appId: s2sProvider.appId, path: this.path, timestamp };
      if (body !== undefined) {
        payload.body = body;
      }

      const sorted = JSON.stringify(payload, Object.keys(payload).sort());
      const signature = await s2sProvider.sign(await sha256(sorted));
      headers["x-ba-request-timestamp"] = timestamp;
      headers["x-ba-app"] = s2sProvider.appId;
      headers["x-ba-signature"] = signature;
    } else if (!options?.skipAuth) {
      const accessToken = await tokenProvider.get();
      if (accessToken) {
        headers["x-access-token"] = accessToken;
      }
    }

    const response = await fetch(url, {
      method: this.method,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(response.status ?? 500, err.message ?? "Request failed", err.details);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as TRes;
    }

    return response.json();
  }
}

// Builder: after .withRequest() - IS a contract (defaults to void), can add .withResponse()
export class ContractWithRequest<TReq extends Record<string, unknown>> extends ApiContract<TReq, void> {
  withResponse<TEntries extends v.ObjectEntries>(entries: TEntries): ApiContract<TReq, v.InferOutput<v.ObjectSchema<TEntries, undefined>>> {
    const responseSchema = v.object(entries);
    type TRes = v.InferOutput<typeof responseSchema>;
    return new ApiContract<TReq, TRes>(this.method, this.path, this.schema, responseSchema, this.isS2S);
  }
}

// Builder: initial state - IS a contract (defaults to void), can add .withRequest() or .withResponse()
export class ContractBuilder extends ApiContract<EmptyRequest, void> {
  constructor(method: HttpMethod, path: string, isS2S = false) {
    super(method, path, emptySchema, undefined, isS2S);
  }

  s2s(): ContractBuilder {
    return new ContractBuilder(this.method, this.path, true);
  }

  withRequest<TReq extends v.ObjectEntries>(entries: TReq): ContractWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>> {
    const schema = v.object(entries);
    return new ContractWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>>(this.method, this.path, schema, undefined, this.isS2S);
  }

  withResponse<TRes extends v.ObjectEntries>(entries: TRes): ApiContract<EmptyRequest, v.InferOutput<v.ObjectSchema<TRes, undefined>>> {
    const responseSchema = v.object(entries);
    type TResponse = v.InferOutput<typeof responseSchema>;
    return new ApiContract<EmptyRequest, TResponse>(this.method, this.path, emptySchema, responseSchema, this.isS2S);
  }
}

// API contract - auto-adds /api prefix
export const api = (method: HttpMethod, path: string): ContractBuilder => new ContractBuilder(method, `/api${path}`);
