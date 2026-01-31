import { createSpaRouter } from "@broccoliapps/browser";
import { Layout } from "./layout/Layout";
import { AccountDetailPage, ArchivedAccountsPage, AuthCallback, BucketsPage, HomePage, NewAccountPage, OnboardingPage, SettingsPage } from "./pages";

export const { App, AppLink } = createSpaRouter({
  routes: {
    "/": { page: HomePage },
    "/auth/callback": { page: AuthCallback },
    "/onboarding": { page: OnboardingPage, withLayout: false },
    "/new": { page: NewAccountPage },
    "/buckets": { page: BucketsPage },
    "/archived": { page: ArchivedAccountsPage },
    "/settings": { page: SettingsPage },
    "/accounts/:id": { page: AccountDetailPage },
  },
  Layout,
  unauthPaths: ["/auth/callback", "/onboarding"],
});
