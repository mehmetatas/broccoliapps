// Client-side hydration entry point
import { hydrate } from "preact";
import { App } from "./App";

// CSS import for Vite HMR in development only
// In production, CSS is loaded via <link> tag in Html.tsx
if (import.meta.env.DEV) {
  import("./app.css");
}

declare global {
  interface Window {
    __PAGE_PROPS__: Record<string, unknown>;
  }
}

const hydrateApp = () => {
  const appElement = document.getElementById("app");
  if (!appElement) {
    console.error("App element not found");
    return;
  }

  // Get props from server-rendered data
  const pageProps = window.__PAGE_PROPS__ ?? {};

  // Get status code from data attribute
  const status = parseInt(appElement.dataset.status || "200", 10);

  // Hydrate the app
  hydrate(<App pageProps={pageProps} status={status} />, appElement);
};

// Wait for DOM if still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateApp);
} else {
  hydrateApp();
}
