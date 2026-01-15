import type { ComponentType } from "preact";
import Router, { type RoutableProps } from "preact-router";
import { Layout } from "./layout/Layout";
import { ApiTestPage, AuthPage, HomePage, NotFoundPage, UserDetailPage, UsersListPage } from "./pages";

type AppProps = {
  pageProps: Record<string, unknown>;
  status: number;
};

// Routes with Layout (header/footer)
const routesWithLayout: Record<string, ComponentType<any>> = {
  "/": HomePage,
  "/users": UsersListPage,
  "/users/:id": UserDetailPage,
  "/api-test": ApiTestPage,
};

// Routes without Layout
const routesWithoutLayout: Record<string, ComponentType<any>> = {
  "/auth": AuthPage,
};

// Route component that wraps page with Layout based on withLayout prop
const Route = ({
  component: Component,
  pageProps,
  withLayout = true,
  ...routeParams
}: RoutableProps & {
  component: ComponentType<any>;
  pageProps: Record<string, unknown>;
  withLayout?: boolean;
}) => {
  const page = <Component {...pageProps} {...routeParams} />;
  return <Layout skip={!withLayout}>{page}</Layout>;
};

export const App = ({ pageProps, status }: AppProps) => {
  // 404 page - no layout
  if (status === 404) {
    return <NotFoundPage />;
  }

  return (
    <Router>
      {Object.entries(routesWithLayout).map(([path, component]) => (
        <Route key={path} path={path} component={component} pageProps={pageProps} withLayout={true} />
      ))}
      {Object.entries(routesWithoutLayout).map(([path, component]) => (
        <Route key={path} path={path} component={component} pageProps={pageProps} withLayout={false} />
      ))}
      <Route default component={NotFoundPage} pageProps={pageProps} withLayout={false} />
    </Router>
  );
};
