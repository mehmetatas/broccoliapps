import { ApiError, refreshToken, setTokenProvider } from "@broccoliapps/shared";
import type { ComponentType } from "preact";
import { render } from "preact";
import { AUTH_CACHE_KEYS, signOut } from "./auth-cache";
import { cache } from "./cache";
import { ToastContainer } from "./components/ToastContainer";
import { applyTheme, getStoredTheme } from "./theme";

let inflight: Promise<string | undefined> | null = null;

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
      if (inflight) {
        return inflight;
      }
      inflight = (async () => {
        try {
          const response = await refreshToken.invoke({ refreshToken: oldRefreshToken }, { skipAuth: true });
          cache.set(AUTH_CACHE_KEYS.accessToken, response.accessToken, response.accessTokenExpiresAt);
          cache.set(AUTH_CACHE_KEYS.refreshToken, response.refreshToken, response.refreshTokenExpiresAt);
          return response.accessToken;
        } catch (error) {
          if (error instanceof ApiError && error.status === 403) {
            signOut();
          }
          return undefined;
        }
      })();
      try {
        return await inflight;
      } finally {
        inflight = null;
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
    render(
      <>
        <App />
        <ToastContainer />
      </>,
      appElement,
    );
  };

  // Wait for DOM if still loading
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderApp);
  } else {
    renderApp();
  }
};
