import { PageResponse } from "@broccoliapps/backend";
import type { Cookie } from "@broccoliapps/shared";
import type { VNode } from "preact";
import { render as renderToString } from "preact-render-to-string";
import { Html } from "../client/layout/Html";

/**
 * Options for page rendering
 */
type PageOptions = {
  title?: string;
  skipLayout?: boolean;
  staticPage?: boolean;
  status?: number;
  cookies?: Cookie[];
  headers?: Record<string, string>;
};

/**
 * Render a page component to HTML response.
 *
 * @example
 * page.route("/users/:id").handler(async (req) => {
 *   return render(<UserDetailPage id={req.id} name="Alice" />, { title: "User Details" })
 * });
 */
export const render = (element: VNode, options: PageOptions = {}): PageResponse => {
  const pageProps = element.props as Record<string, unknown>;

  // Extract component name for client hydration
  const pageName =
    typeof element.type === "function"
      ? element.type.displayName || element.type.name || "Unknown"
      : "Unknown";

  const html = renderToString(
    <Html
      pageProps={pageProps}
      pageName={pageName}
      title={options.title}
      status={options.status}
      staticPage={options.staticPage}
      skipLayout={options.skipLayout}
    >
      {element}
    </Html>
  );

  return {
    status: options.status ?? 200,
    html: "<!DOCTYPE html>" + html,
    cookies: options.cookies,
    headers: options.headers,
  };
};
