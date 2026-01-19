import { cache } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useEffect, useState } from "preact/hooks";
import { postAuthExchange } from "../../../../shared/api-contracts";

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      setError("Missing auth code");
      return;
    }

    postAuthExchange
      .invoke({ code })
      .then(({ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt }) => {
        cache.set("accessToken", accessToken, accessTokenExpiresAt);
        cache.set("refreshToken", refreshToken, refreshTokenExpiresAt);
        route("/app");
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div class="flex min-h-screen items-center justify-center bg-gray-50">
        <div class="rounded-lg bg-white p-8 shadow-md">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="mb-2 text-lg font-semibold text-gray-900">Authentication Failed</h2>
          <p class="mb-4 text-sm text-gray-600">{error}</p>
          <a href="/" class="text-sm font-medium text-blue-600 hover:text-blue-500">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <div class="text-center">
        <div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
        <p class="text-sm font-medium text-gray-600">Signing you in...</p>
      </div>
    </div>
  );
};
