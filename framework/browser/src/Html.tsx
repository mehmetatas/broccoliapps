import type { ComponentChildren, ComponentType } from "preact";

declare const __BUILD_ID__: string;

export type HtmlProps = {
  title?: string;
  description?: string;
  devPort: number;
  clientEntry?: string;
  layout: ComponentType<{ children: ComponentChildren; skip?: boolean }>;
  pageProps?: Record<string, unknown>;
  staticPage?: boolean;
  skipLayout?: boolean;
  status?: number;
  children: ComponentChildren;
};

export const Html = ({
  title,
  description,
  devPort,
  clientEntry = "src/ui/www/client/index.tsx",
  layout: Layout,
  pageProps,
  staticPage = false,
  skipLayout = false,
  status = 200,
  children,
}: HtmlProps) => {
  // Build ID from esbuild define (set at build time)
  const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "";

  // Dev mode: use NODE_ENV or check if running without build ID
  const isDevMode = process.env.NODE_ENV === "development" || (!buildId && typeof window === "undefined");

  // CSS is always loaded (built by PostCSS for Tailwind 4)
  // In dev mode, Vite serves JS with HMR; in prod, load from static path
  const cssFile = buildId ? `/static/www.${buildId}.css` : "/static/www.css";
  const jsFile = isDevMode ? `http://localhost:${devPort}/${clientEntry}` : buildId ? `/static/www.${buildId}.js` : "/static/www.js";

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        <title>{title}</title>
        {description && <meta name="description" content={description} />}

        {/* Preconnect for fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="/static/logo-64.png" />

        {/* CSS - only load in production (Vite handles CSS in dev via JS import) */}
        {!isDevMode && <link rel="stylesheet" href={cssFile} />}
      </head>
      <body>
        <div id="app" data-status={status}>
          <Layout skip={skipLayout}>{children}</Layout>
        </div>

        {/* Hydration props (only for non-static pages) */}
        {!staticPage && (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__PAGE_PROPS__=${JSON.stringify(pageProps ?? {})};`,
            }}
          />
        )}

        {/* Client bundle — always in dev (for CSS), only non-static in prod */}
        {(!staticPage || isDevMode) && <script type="module" src={jsFile} />}

        {/* Vite HMR client (dev mode only) */}
        {isDevMode && <script type="module" src={`http://localhost:${devPort}/@vite/client`} />}
      </body>
    </html>
  );
};
