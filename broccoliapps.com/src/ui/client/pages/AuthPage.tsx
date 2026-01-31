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
    <div class="flex justify-center items-center h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-950 text-neutral-900 dark:text-neutral-200">
      <p>Signing in with {provider.charAt(0).toUpperCase() + provider.substring(1)}...</p>
    </div>
  );
};
