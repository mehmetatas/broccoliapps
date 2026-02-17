/// <reference types="vite/client" />
import { hydrateWww } from "@broccoliapps/browser";
import { App } from "./App";

// CSS import for Vite HMR in development only
// In production, CSS is loaded via <link> tag in Html.tsx
if (import.meta.env.DEV) {
  import("./app.css");
}

hydrateWww(App);
