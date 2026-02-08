import { AuthCallback as AuthCallbackBase, preferences } from "@broccoliapps/browser";
import { route } from "preact-router";
import * as client from "../api";

export const AuthCallback = () => {
  return (
    <AuthCallbackBase
      onSuccess={(response) => {
        client.setUserFromAuth(response.user);
        preferences.getAll().then((prefs) => {
          if (!prefs.targetCurrency) {
            route("/app/onboarding");
          } else {
            route("/app");
          }
        });
      }}
    />
  );
};
