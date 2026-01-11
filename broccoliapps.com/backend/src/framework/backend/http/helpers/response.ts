import type { HttpResponse, ResponseOptions } from "../../../shared";

// Re-export types from shared for convenience
export type { Schema, ResponseOptions } from "../../../shared";

// Response helpers passed to impl() callback - enforces strict type checking
export type ResponseHelpers<TRes> = {
  ok: (data: TRes, options?: ResponseOptions) => HttpResponse<TRes>;
  created: (data: TRes, options?: ResponseOptions) => HttpResponse<TRes>;
  noContent: (options?: ResponseOptions) => HttpResponse<undefined>;
};

// Create response helpers for a given response type
export const createResponseHelpers = <TRes>(): ResponseHelpers<TRes> => ({
  ok: (data: TRes, options?: ResponseOptions): HttpResponse<TRes> => ({ status: 200, data, ...options }),
  created: (data: TRes, options?: ResponseOptions): HttpResponse<TRes> => ({ status: 201, data, ...options }),
  noContent: (options?: ResponseOptions): HttpResponse<undefined> => ({ status: 204, data: undefined, ...options }),
});

// Page response helpers - enforces strict type checking on props
export type PageResponseHelpers<TProps> = {
  render: (props: TProps, options?: ResponseOptions) => HttpResponse<TProps>;
};

// Create page response helpers
export const createPageResponseHelpers = <TProps>(): PageResponseHelpers<TProps> => ({
  render: (props: TProps, options?: ResponseOptions): HttpResponse<TProps> => ({
    status: 200,
    data: props,
    ...options,
  }),
});
