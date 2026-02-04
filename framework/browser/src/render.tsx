import type { Cookie } from "@broccoliapps/shared";
import type { ComponentChildren, ComponentType, VNode } from "preact";
import { render as renderToString } from "preact-render-to-string";

type PageOptions = {
  title?: string;
  skipLayout?: boolean;
  staticPage?: boolean;
  status?: number;
  cookies?: Cookie[];
  headers?: Record<string, string>;
};

type RenderResult = {
  status: number;
  html: string;
  cookies?: Cookie[];
  headers?: Record<string, string>;
};

type RenderHtmlProps = {
  title?: string;
  pageProps?: Record<string, unknown>;
  staticPage?: boolean;
  skipLayout?: boolean;
  status?: number;
  children: ComponentChildren;
};

export const createRender = (Html: ComponentType<RenderHtmlProps>): ((element: VNode, options?: PageOptions) => RenderResult) => {
  return (element: VNode, options: PageOptions = {}): RenderResult => {
    const pageProps = element.props as Record<string, unknown>;

    const html = renderToString(
      <Html pageProps={pageProps} title={options.title} status={options.status} staticPage={options.staticPage} skipLayout={options.skipLayout}>
        {element}
      </Html>,
    );

    return {
      status: options.status ?? 200,
      html: "<!DOCTYPE html>" + html,
      cookies: options.cookies,
      headers: options.headers,
    };
  };
};
