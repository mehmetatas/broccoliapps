import type { ComponentType } from "preact";
import { hydrate } from "preact";

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: declaration merging requires interface
  interface Window {
    __PAGE_PROPS__: Record<string, unknown>;
  }
}

export const hydrateWww = (App: ComponentType<{ pageProps: Record<string, unknown>; status: number }>): void => {
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
};
