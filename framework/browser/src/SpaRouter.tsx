import type { AnchorHTMLAttributes, ComponentChildren, ComponentType } from "preact";
import Router, { type RoutableProps } from "preact-router";
import { AUTH_CACHE_KEYS } from "./auth-cache";
import { cache } from "./cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

type RouteConfig = { page: AnyComponent; withLayout?: boolean };

type SpaRouterConfig = {
  routes: Record<string, RouteConfig>;
  Layout: ComponentType<{ children: ComponentChildren }>;
  unauthPaths?: string[];
};

const APP_BASE = "/app";

const appPath = (path: string) => APP_BASE + (path === "/" ? "" : path);

// Route component that wraps page with Layout based on withLayout prop
const AppRoute = ({
  page: Page,
  withLayout = true,
  layout: Layout,
  ...routeParams
}: RoutableProps & {
  page: AnyComponent;
  withLayout?: boolean;
  layout: ComponentType<{ children: ComponentChildren }>;
}) =>
  withLayout ? (
    <Layout>
      <Page {...routeParams} />
    </Layout>
  ) : (
    <Page {...routeParams} />
  );
export const createSpaRouter = (
  config: SpaRouterConfig,
): {
  App: ComponentType;
  AppLink: ComponentType<AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }>;
} => {
  const { routes, Layout, unauthPaths = [] } = config;

  const AppLink = ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
    return <a {...rest} href={appPath(href)} />;
  };

  const App = () => {
    const currentPath = window.location.pathname;

    // Check if current path is exempt from auth redirect
    const isUnauthPath = unauthPaths.some((p) => currentPath === appPath(p));

    // Redirect to landing page if not authenticated and not on an unauth path
    if (!isUnauthPath && !cache.get(AUTH_CACHE_KEYS.refreshToken)) {
      window.location.href = "/";
      return null;
    }

    return (
      <Router>
        {Object.entries(routes).map(([path, { page, withLayout }]) => (
          <AppRoute key={appPath(path)} path={appPath(path)} page={page} withLayout={withLayout} layout={Layout} />
        ))}
      </Router>
    );
  };

  return { App, AppLink };
};
