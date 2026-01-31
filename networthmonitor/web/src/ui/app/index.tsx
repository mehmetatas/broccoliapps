// Client-side hydration entry point
import { initSpaApp } from "@broccoliapps/browser";
import { App } from "./SpaApp";

// CSS import for Vite HMR in development only
// In production, CSS is loaded via <link> tag in Html.tsx from CDN
if (import.meta.env.DEV) {
  import("./app.css");
}

initSpaApp({ app: App });
