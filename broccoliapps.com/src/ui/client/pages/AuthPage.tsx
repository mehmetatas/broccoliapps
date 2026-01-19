import { cognitoClient, type CognitoIdentityProvider } from "@broccoliapps/browser";
import { useEffect } from "preact/hooks";

type AuthPageProps = {
  app: string;
  provider: CognitoIdentityProvider;
};

export const AuthPage = ({ app, provider }: AuthPageProps) => {
  useEffect(() => {
    cognitoClient.signInWith(provider, app);
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <p>Signing in with {provider.charAt(0).toUpperCase() + provider.substring(1)}...</p>
    </div>
  );
};
