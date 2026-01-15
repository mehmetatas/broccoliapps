import type { Cookie, HttpResponse, ResponseOptions } from "@broccoliapps/shared";

// API response object passed to handler callback - enforces strict type checking
export type ApiResponse<TRes> = {
  ok: (data: TRes, options?: ResponseOptions) => HttpResponse<TRes>;
  created: (data: TRes, options?: ResponseOptions) => HttpResponse<TRes>;
  noContent: (options?: ResponseOptions) => HttpResponse<undefined>;
};

// Create API response object for a given response type
export const createApiResponse = <TRes>(): ApiResponse<TRes> => ({
  ok: (data: TRes, options?: ResponseOptions): HttpResponse<TRes> => ({ status: 200, data, ...options }),
  created: (data: TRes, options?: ResponseOptions): HttpResponse<TRes> => ({ status: 201, data, ...options }),
  noContent: (options?: ResponseOptions): HttpResponse<undefined> => ({ status: 204, data: undefined, ...options }),
});

// Response from page handler - router just returns this as html
export type PageResponse = {
  status: number;
  data: string;
  cookies?: Cookie[];
  headers?: Record<string, string>;
};
