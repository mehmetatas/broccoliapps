import { cache } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useEffect, useState } from "preact/hooks";
import { authExchange } from "@broccoliapps/tasquito-shared";
import { setUserFromAuth, CACHE_KEYS } from "../api";

export const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!code) {
      setError("Missing auth code");
      return;
    }

    authExchange
      .invoke({ code })
      .then(({ accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt, user }) => {
        cache.set(CACHE_KEYS.accessToken, accessToken, accessTokenExpiresAt);
        cache.set(CACHE_KEYS.refreshToken, refreshToken, refreshTokenExpiresAt);
        setUserFromAuth(user);
        route("/app");
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950">
        <div class="rounded-lg bg-white dark:bg-neutral-800 p-8 shadow-md">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <svg class="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 class="mb-2 text-lg font-semibold text-gray-900 dark:text-neutral-100">Authentication Failed</h2>
          <p class="mb-4 text-sm text-gray-600 dark:text-neutral-400">{error}</p>
          <a href="/" class="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-200 dark:from-neutral-900 dark:to-neutral-950">
      <div class="text-center">
        <div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-neutral-700 border-t-emerald-600" />
        <p class="text-sm font-medium text-gray-600 dark:text-neutral-400">Signing you in...</p>
      </div>
    </div>
  );
};
