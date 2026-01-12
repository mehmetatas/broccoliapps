import type { HttpResponse, ResponseOptions } from "../../../shared";

// Page response object - enforces strict type checking on props
export type PageResponse<TProps> = {
  render: (props: TProps, options?: ResponseOptions) => HttpResponse<TProps>;
};

// Create page response object
export const createPageResponse = <TProps>(): PageResponse<TProps> => ({
  render: (props: TProps, options?: ResponseOptions): HttpResponse<TProps> => ({
    status: 200,
    data: props,
    ...options,
  }),
});
