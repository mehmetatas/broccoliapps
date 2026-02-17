import { createWwwApp } from "@broccoliapps/browser";
import { Layout } from "./layout/Layout";
import { ErrorPage, HomePage, PrivacyPage, TermsPage } from "./pages";

export const App = createWwwApp({
  routesWithLayout: {
    "/": HomePage,
    "/terms": TermsPage,
    "/privacy": PrivacyPage,
  },
  Layout,
  ErrorPage,
});
