import { cache } from "@broccoliapps/browser";
import { useState } from "preact/hooks";
import type { AuthUser } from "../../../shared/api-contracts";
import { patchUser } from "../../../shared/api-contracts";
import { CurrencyPicker, PageHeader } from "../components";

type Theme = "system" | "light" | "dark";

const getStoredTheme = (): Theme => {
  if (typeof localStorage === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
};

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // System preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }
};

export const SettingsPage = () => {
  const user = cache.get<AuthUser>("user");
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [currency, setCurrency] = useState(user?.targetCurrency || "USD");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    setSaving(true);
    setSaved(false);
    try {
      const updatedUser = await patchUser.invoke({ targetCurrency: newCurrency });
      cache.set("user", { ...user, targetCurrency: updatedUser.targetCurrency });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update currency:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    cache.remove("accessToken");
    cache.remove("refreshToken");
    cache.remove("user");
    window.location.href = "/";
  };

  return (
    <div>
      <PageHeader title="Settings" backHref="/" />
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Theme
          </label>
          <div class="flex gap-2">
            {(["system", "light", "dark"] as Theme[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleThemeChange(option)}
                class={`px-4 py-2 text-sm rounded-md border ${theme === option
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-600"
                  }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
            Target Currency
            {saving && <span class="ml-2 text-xs text-neutral-500">Saving...</span>}
            {saved && <span class="ml-2 text-xs text-green-600 dark:text-green-400">Saved</span>}
          </label>
          <CurrencyPicker value={currency} onChange={handleCurrencyChange} />
          <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Your net worth will be displayed in this currency.
          </p>
        </div>
      </div>

      <div class="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={handleSignOut}
          class="w-full px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
};
