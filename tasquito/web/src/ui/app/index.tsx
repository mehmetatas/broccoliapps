// Client-side entry point for SPA
import { cache } from "@broccoliapps/browser";
import { setTokenProvider } from "@broccoliapps/shared";
import { render } from "preact";
import { refreshToken } from "@broccoliapps/tasquito-shared";
import { initClient } from "@broccoliapps/tasquito-shared/client";
import { CACHE_KEYS } from "./api";
import { App } from "./SpaApp";
import { applyTheme, getStoredTheme } from "./utils/themeUtils";

// Initialize shared client with browser cache provider
initClient(cache);

// CSS import for Vite HMR in development only
// In production, CSS is loaded via <link> tag in AppHtml.tsx
if (import.meta.env.DEV) {
  import("./app.css");
}

// Apply theme on initial load
applyTheme();

// Listen for system theme changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (getStoredTheme() === "system") {
    applyTheme();
  }
});

// Configure access token getter for authenticated API requests
setTokenProvider({
  get: async () => {
    const accessToken = cache.get<string>(CACHE_KEYS.accessToken);
    if (accessToken) {
      return accessToken;
    }
    const oldRefreshToken = cache.get<string>(CACHE_KEYS.refreshToken);
    if (!oldRefreshToken) {
      return undefined;
    }
    const response = await refreshToken.invoke(
      { refreshToken: oldRefreshToken },
      { skipAuth: true }
    );
    cache.set(CACHE_KEYS.accessToken, response.accessToken, response.accessTokenExpiresAt);
    cache.set(CACHE_KEYS.refreshToken, response.refreshToken, response.refreshTokenExpiresAt);
    return response.accessToken;
  },
});

const renderApp = () => {
  const appElement = document.getElementById("app");
  if (!appElement) {
    console.error("App element not found");
    return;
  }

  // Render the app
  render(<App />, appElement);
};

// Wait for DOM if still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderApp);
} else {
  renderApp();
}
