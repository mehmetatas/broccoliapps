import { cache } from "@broccoliapps/browser";
import type { AnchorHTMLAttributes, ComponentType } from "preact";
import Router, { type RoutableProps } from "preact-router";
import { Layout } from "./layout/Layout";
import { AuthCallback, HomePage } from "./pages";

// Route component that wraps page with Layout based on withLayout prop
const AppRoute = ({
  page: Page,
  ...routeParams
}: RoutableProps & {
  page: ComponentType<any>;
}) => (
  <Layout>
    <Page {...routeParams} />
  </Layout>
);

const APP_BASE = "/app";
const ROUTES: Record<string, ComponentType<any>> = {
  "/": HomePage,
  "/auth/callback": AuthCallback,
};

const appPath = (path: string) => APP_BASE + (path === "/" ? "" : path);

export const AppLink = ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
  return (
    <a {...rest} href={appPath(href)} />
  );
}

export const App = () => {
  const isAuthCallback = window.location.pathname === appPath("/auth/callback");
  if (!isAuthCallback && !cache.get("refreshToken")) {
    window.location.href = "/";
    return null;
  }

  return (
    <Router>
      {Object.entries(ROUTES).map(([path, page]) => (
        <AppRoute key={appPath(path)} path={appPath(path)} page={page} />
      ))}
    </Router>
  );
};
