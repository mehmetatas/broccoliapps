import { AuthCallback as AuthCallbackBase } from "@broccoliapps/browser";
import { setUserFromAuth } from "@broccoliapps/tasquito-shared";
import { route } from "preact-router";

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
