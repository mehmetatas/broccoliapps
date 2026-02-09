import { refreshToken, setTokenProvider } from "@broccoliapps/shared";
import type { ComponentType } from "preact";
import { render } from "preact";
import { AUTH_CACHE_KEYS, signOut } from "./auth-cache";
import { cache } from "./cache";
import { applyTheme, getStoredTheme } from "./theme";

export const initSpaApp = (config: { app: ComponentType }): void => {
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
      const accessToken = cache.get<string>(AUTH_CACHE_KEYS.accessToken);
      if (accessToken) {
        return accessToken;
      }
      const oldRefreshToken = cache.get<string>(AUTH_CACHE_KEYS.refreshToken);
      if (!oldRefreshToken) {
        return undefined;
      }
      try {
        const response = await refreshToken.invoke({ refreshToken: oldRefreshToken }, { skipAuth: true });
        cache.set(AUTH_CACHE_KEYS.accessToken, response.accessToken, response.accessTokenExpiresAt);
        cache.set(AUTH_CACHE_KEYS.refreshToken, response.refreshToken, response.refreshTokenExpiresAt);
        return response.accessToken;
      } catch {
        signOut();
        return undefined;
      }
    },
  });

  // Render app to DOM
  const App = config.app;
  const renderApp = () => {
    const appElement = document.getElementById("app");
    if (!appElement) {
      console.error("App element not found");
      return;
    }
    render(<App />, appElement);
  };

  // Wait for DOM if still loading
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderApp);
  } else {
    renderApp();
  }
};
