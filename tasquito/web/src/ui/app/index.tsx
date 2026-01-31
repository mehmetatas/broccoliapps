// Client-side entry point for SPA
import { cache, initSpaApp } from "@broccoliapps/browser";
import { initClient } from "@broccoliapps/tasquito-shared/client";
import { App } from "./SpaApp";

// Initialize shared client with browser cache provider
initClient(cache);

// CSS import for Vite HMR in development only
// In production, CSS is loaded via <link> tag in AppHtml.tsx
if (import.meta.env.DEV) {
  import("./app.css");
}

initSpaApp({ app: App });
