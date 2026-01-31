import { createWwwApp } from "@broccoliapps/browser";
import { Layout } from "./layout/Layout";
import { ErrorPage, HomePage } from "./pages";

export const App = createWwwApp({
  routesWithLayout: {
    "/": HomePage,
  },
  Layout,
  ErrorPage,
});
