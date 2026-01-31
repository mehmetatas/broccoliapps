import { AuthCallback as AuthCallbackBase } from "@broccoliapps/browser";
import { route } from "preact-router";
import { setUserFromAuth } from "../api";

export const AuthCallback = () => {
  return (
    <AuthCallbackBase
      onSuccess={(response) => {
        setUserFromAuth(response.user);
        route("/app");
      }}
    />
  );
};
