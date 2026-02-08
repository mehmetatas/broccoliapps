import { AuthCallback as AuthCallbackBase } from "@broccoliapps/browser";
import { route } from "preact-router";
import * as client from "../api";

export const AuthCallback = () => {
  return (
    <AuthCallbackBase
      onSuccess={(response) => {
        client.setUserFromAuth(response.user);
        route("/app");
      }}
    />
  );
};
