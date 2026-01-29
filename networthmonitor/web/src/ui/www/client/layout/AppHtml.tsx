declare const __BUILD_ID__: string;

export type AppHtmlProps = {
  title?: string;
  description?: string;
};

export const AppHtml = ({
  title = "Net Worth Monitor",
  description = "Track and monitor your net worth",
}: AppHtmlProps) => {
  // Build ID from esbuild define (set at build time)
  const buildId = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "";

  // Dev mode: use NODE_ENV or check if running without build ID
  const isDevMode = process.env.NODE_ENV === "development" || (!buildId && typeof window === "undefined");

  // CSS is always loaded (built by PostCSS for Tailwind 4)
  // In dev mode, Vite serves JS with HMR; in prod, load from static path
  const cssFile = buildId ? `/static/app.${buildId}.css` : "/static/app.css";
  const jsFile = isDevMode
    ? "http://localhost:5174/src/ui/app/index.tsx"
    : buildId
      ? `/static/app.${buildId}.js`
      : "/static/app.js"; // TODO this needs to be different for SPA

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />

        {/* Preconnect for fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* CSS - only load in production (Vite handles CSS in dev via JS import) */}
        {!isDevMode && <link rel="stylesheet" href={cssFile} />}
      </head>
      <body>
        <div id="app" />

        {/* Client bundle */}
        <script type="module" src={jsFile} />
        {/* Vite HMR client (dev mode only) */}
        {isDevMode && <script type="module" src="http://localhost:5174/@vite/client" />}
      </body>
    </html>
  );
};
