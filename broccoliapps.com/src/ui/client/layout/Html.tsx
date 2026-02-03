import type { ComponentChildren } from "preact";
import { Layout } from "./Layout";

declare const __BUILD_ID__: string;

export type HtmlProps = {
  title?: string;
  pageProps?: Record<string, unknown>;
  staticPage?: boolean;
  skipLayout?: boolean;
  status?: number;
  children: ComponentChildren;
};

export const Html = ({ title = "Broccoli Apps", pageProps, staticPage = false, skipLayout = false, status = 200, children }: HtmlProps) => {
  const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "";
  const isDevMode = process.env.NODE_ENV === "development" || (!buildId && typeof window === "undefined");

  const cssFile = buildId ? `/static/app.${buildId}.css` : "/static/app.css";
  const jsFile = isDevMode ? "http://localhost:5080/src/ui/client/index.tsx" : buildId ? `/static/app.${buildId}.js` : "/static/app.js";

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content="The healthy food aisle of software" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/static/logo-64.png" />

        <link rel="stylesheet" href={isDevMode ? "http://localhost:5080/src/ui/client/app.css" : cssFile} />
      </head>
      <body>
        <div id="app" data-status={status}>
          <Layout skip={skipLayout}>{children}</Layout>
        </div>

        {isDevMode && <script type="module" src="http://localhost:5080/@vite/client" />}
        {!staticPage && (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `window.__PAGE_PROPS__=${JSON.stringify(pageProps ?? {})};`,
              }}
            />
            <script type="module" src={jsFile} />
          </>
        )}
      </body>
    </html>
  );
};
