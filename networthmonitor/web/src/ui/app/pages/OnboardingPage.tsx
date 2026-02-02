import { Button, preferences } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useState } from "preact/hooks";
import { getUserSync } from "../api";
import { CurrencyPicker } from "../components";

export const OnboardingPage = () => {
  const user = getUserSync();
  const [currency, setCurrency] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = user?.name?.split(" ")[0] || "there";

  const handleContinue = async () => {
    if (!currency) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await preferences.set("targetCurrency", currency);
      route("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save currency");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
      <div class="max-w-2xl w-full bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          Welcome, {firstName}!
        </h1>
        <p class="text-neutral-600 dark:text-neutral-400 mb-6">
          Let's get started by selecting your preferred currency for tracking your net worth.
        </p>

        <div class="mb-6">
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </div>

        {error &&
          <p class="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
        }

        <Button
          onClick={handleContinue}
          disabled={!currency || saving}
          class="w-full"
        >
          {saving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
};
