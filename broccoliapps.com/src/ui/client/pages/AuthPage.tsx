import { cognitoClient, type CognitoIdentityProvider } from "@broccoliapps/browser";
import { useEffect } from "preact/hooks";

type AuthPageProps = {
  app: string;
  provider: CognitoIdentityProvider;
  platform?: "mobile";
};

export const AuthPage = ({ app, provider, platform }: AuthPageProps) => {
  useEffect(() => {
    cognitoClient.signInWith(provider, app, platform);
  }, []);

  return (
    <div class="auth-page">
      <p>Signing in with {provider.charAt(0).toUpperCase() + provider.substring(1)}...</p>
    </div>
  );
};
