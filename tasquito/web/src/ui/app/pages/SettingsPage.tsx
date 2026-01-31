import { ArrowLeft, LogOut } from "lucide-preact";
import { useState } from "preact/hooks";
import { ThemeSettings, type Theme, getStoredTheme } from "@broccoliapps/browser";
import { signOut } from "../api";
import { AppLink } from "../SpaApp";

export const SettingsPage = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const handleSignOut = () => {
    signOut();
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex items-center gap-4">
        <AppLink
          href="/"
          class="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </AppLink>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Settings</h1>
      </div>

      {/* Settings sections */}
      <div class="space-y-6">
        {/* Appearance section */}
        <div class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
            <h2 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Appearance</h2>
          </div>
          <div class="p-5">
            <ThemeSettings value={theme} onChange={setTheme} />
          </div>
        </div>

        {/* Account section */}
        <div class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-700">
            <h2 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">Account</h2>
          </div>
          <div class="p-5">
            <button
              type="button"
              onClick={handleSignOut}
              class="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
