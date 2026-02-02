import type { ComponentChildren, ComponentType } from "preact";
import Router, { type RoutableProps } from "preact-router";

type WwwAppConfig = {
  routesWithLayout: Record<string, ComponentType<unknown>>;
  routesWithoutLayout?: Record<string, ComponentType<unknown>>;
  Layout: ComponentType<{ children: ComponentChildren; skip?: boolean }>;
  ErrorPage: ComponentType<{ status: number; message: string; details?: string[] }>;
};

type AppProps = {
  pageProps: Record<string, unknown>;
  status: number;
};

export function createWwwApp(config: WwwAppConfig): ComponentType<AppProps> {
  const { routesWithLayout, routesWithoutLayout = {}, Layout, ErrorPage } = config;

  // Route component that wraps page with Layout based on withLayout prop
  const Route = ({
    component: Component,
    pageProps,
    withLayout = true,
    ...routeParams
  }: RoutableProps & {
    component: ComponentType<unknown>;
    pageProps: Record<string, unknown>;
    withLayout?: boolean;
  }) => {
    const page = <Component {...pageProps} {...routeParams} />;
    return <Layout skip={!withLayout}>{page}</Layout>;
  };

  // Client-side 404 component for router default
  const ClientNotFound = () => <ErrorPage status={404} message="Page Not Found" />;

  return ({ pageProps, status }: AppProps) => {
    // Error pages (4xx, 5xx) - no layout
    if (status >= 400) {
      const errorProps = pageProps as {
        status: number;
        message: string;
        details?: string[];
      };
      return <ErrorPage {...errorProps} />;
    }

    return (
      <Router>
        {Object.entries(routesWithLayout).map(([path, component]) =>
          <Route key={path} path={path} component={component} pageProps={pageProps} withLayout={true} />
        )}
        {Object.entries(routesWithoutLayout).map(([path, component]) =>
          <Route key={path} path={path} component={component} pageProps={pageProps} withLayout={false} />
        )}
        <Route default component={ClientNotFound} pageProps={pageProps} withLayout={false} />
      </Router>
    );
  };
}
