import { createSpaRouter } from "@broccoliapps/browser";
import { Layout } from "./layout/Layout";
import { AuthCallback, HomePage, ProjectDetailPage, SettingsPage } from "./pages";

export const { App, AppLink } = createSpaRouter({
  routes: {
    "/": { page: HomePage },
    "/auth/callback": { page: AuthCallback, withLayout: false },
    "/projects/:id": { page: ProjectDetailPage },
    "/settings": { page: SettingsPage },
  },
  Layout,
  unauthPaths: ["/auth/callback"],
});
