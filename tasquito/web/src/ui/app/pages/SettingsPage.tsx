import { getAuthUser, getStoredTheme, signOut, type Theme, ThemeSettings } from "@broccoliapps/browser";
import { useState } from "preact/hooks";
import { PageHeader } from "../components";

export const SettingsPage = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const user = getAuthUser();

  return (
    <div>
      <PageHeader title={<h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Settings</h2>} backHref="/" />

      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
        {/* User info */}
        {user && (
          <div class="pb-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 class="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Account</h2>
            <p class="text-neutral-900 dark:text-neutral-100 font-medium">{user.name}</p>
            <p class="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
          </div>
        )}

        {/* Theme */}
        <ThemeSettings value={theme} onChange={setTheme} />
      </div>

      {/* Sign out */}
      <div class="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={signOut}
          class="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};
