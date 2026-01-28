import { cache } from "@broccoliapps/browser";
import type { AnchorHTMLAttributes, ComponentType } from "preact";
import Router, { type RoutableProps } from "preact-router";
import { CACHE_KEYS } from "./api/cache";
import { Layout } from "./layout/Layout";
import { AuthCallback, HomePage, TaskDetailPage } from "./pages";

// Route component that wraps page with Layout based on withLayout prop
const AppRoute = ({
  page: Page,
  withLayout = true,
  ...routeParams
}: RoutableProps & {
  page: ComponentType<any>;
  withLayout?: boolean;
}) =>
  withLayout ? (
    <Layout>
      <Page {...routeParams} />
    </Layout>
  ) : (
    <Page {...routeParams} />
  );

const APP_BASE = "/app";
type RouteConfig = { page: ComponentType<any>; withLayout?: boolean };
const ROUTES: Record<string, RouteConfig> = {
  "/": { page: HomePage },
  "/auth/callback": { page: AuthCallback, withLayout: false },
  "/tasks/:id": { page: TaskDetailPage },
};

const appPath = (path: string) => APP_BASE + (path === "/" ? "" : path);

export const AppLink = ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
  return <a {...rest} href={appPath(href)} />;
};

export const App = () => {
  // Check if user is authenticated (has refresh token)
  const currentPath = window.location.pathname;
  const isAuthCallback = currentPath === appPath("/auth/callback");

  // Redirect to landing page if not authenticated and not on auth callback
  if (!isAuthCallback && !cache.get(CACHE_KEYS.refreshToken)) {
    window.location.href = "/";
    return null;
  }

  return (
    <Router>
      {Object.entries(ROUTES).map(([path, { page, withLayout }]) => (
        <AppRoute key={appPath(path)} path={appPath(path)} page={page} withLayout={withLayout} />
      ))}
    </Router>
  );
};
