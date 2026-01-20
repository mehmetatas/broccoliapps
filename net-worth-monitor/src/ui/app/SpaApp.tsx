import { cache } from "@broccoliapps/browser";
import { setTokenProvider } from "@broccoliapps/shared";
import type { AnchorHTMLAttributes, ComponentType } from "preact";
import Router, { type RoutableProps } from "preact-router";
import { refreshToken } from "../../shared/api-contracts";
import { Layout } from "./layout/Layout";
import { AccountDetailPage, AuthCallback, BucketsPage, ClosedDebtsPage, HomePage, ImportPage, NewAccountPage, OnboardingPage, SettingsPage } from "./pages";

// Configure access token getter for authenticated API requests
setTokenProvider({
  get: async () => {
    const accessToken = cache.get<string>("accessToken");
    if (accessToken) {
      return accessToken;
    }
    const oldRefreshToken = cache.get<string>("refreshToken");
    if (!oldRefreshToken) {
      return undefined;
    }
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await refreshToken.invoke(
      { refreshToken: oldRefreshToken },
      { skipAuth: true }
    );
    cache.set("accessToken", newAccessToken);
    cache.set("refreshToken", newRefreshToken);
    return newAccessToken;
  },
});

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
  "/auth/callback": { page: AuthCallback },
  "/onboarding": { page: OnboardingPage, withLayout: false },
  "/new": { page: NewAccountPage },
  "/buckets": { page: BucketsPage },
  "/closed-debts": { page: ClosedDebtsPage },
  "/import": { page: ImportPage },
  "/settings": { page: SettingsPage },
  "/accounts/:id": { page: AccountDetailPage },
};

const appPath = (path: string) => APP_BASE + (path === "/" ? "" : path);

export const AppLink = ({ href, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => {
  return (
    <a {...rest} href={appPath(href)} />
  );
}

export const App = () => {
  const currentPath = window.location.pathname;
  const isAuthCallback = currentPath === appPath("/auth/callback");
  const isOnboarding = currentPath === appPath("/onboarding");

  // Allow auth callback and onboarding without refresh token check
  if (!isAuthCallback && !isOnboarding && !cache.get("refreshToken")) {
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
