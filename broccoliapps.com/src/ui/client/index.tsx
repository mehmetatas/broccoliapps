import { hydrate } from "preact";
import { AuthPage, AuthPageProps } from "./pages";

if (import.meta.env.DEV) {
  import("./app.css");
}

declare global {
  type Window = {
    __PAGE_PROPS__: Record<string, unknown>;
  };
}

const hydrateApp = () => {
  const el = document.getElementById("app");
  if (!el) {
    return;
  }
  const props = window.__PAGE_PROPS__ ?? {};
  hydrate(<AuthPage {...(props as AuthPageProps)} />, el);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", hydrateApp);
} else {
  hydrateApp();
}
