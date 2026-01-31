import { type Theme, ThemeSettings, getStoredTheme, preferences } from "@broccoliapps/browser";
import { useState } from "preact/hooks";
import { signOut } from "../api";
import { PageHeader, TargetCurrencySettings } from "../components";

export const SettingsPage = () => {
  const prefs = preferences.getAllSync();
  const [theme, setTheme] = useState<Theme>(getStoredTheme);
  const [currency, setCurrency] = useState((prefs?.targetCurrency as string) || "USD");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCurrencyChange = async (newCurrency: string) => {
    setCurrency(newCurrency);
    setSaving(true);
    setSaved(false);
    try {
      await preferences.set("targetCurrency", newCurrency);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update currency:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" backHref="/" />
      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 space-y-6">
        <ThemeSettings value={theme} onChange={setTheme} />
        <TargetCurrencySettings
          value={currency}
          onChange={handleCurrencyChange}
          saving={saving}
          saved={saved}
        />
      </div>

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
