// Client-side hydration entry point
import { cache, initSpaApp } from "@broccoliapps/browser";
import { initClient } from "@broccoliapps/nwm-shared";
import { App } from "./SpaApp";

// Initialize shared client with browser cache provider
initClient(cache);

// CSS import for Vite HMR in development only
// In production, CSS is loaded via <link> tag in Html.tsx from CDN
if (import.meta.env.DEV) {
  import("./app.css");
}

initSpaApp({ app: App });
