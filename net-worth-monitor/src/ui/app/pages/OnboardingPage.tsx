import { cache } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useState } from "preact/hooks";
import type { AuthUser } from "../../../shared/api-contracts";
import { patchUser } from "../../../shared/api-contracts";
import { Button, CurrencyPicker } from "../components";

export const OnboardingPage = () => {
  const user = cache.get<AuthUser>("user");
  const [currency, setCurrency] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = user?.name?.split(" ")[0] || "there";

  const handleContinue = async () => {
    if (!currency) return;

    setSaving(true);
    setError(null);

    try {
      const updatedUser = await patchUser.invoke({ targetCurrency: currency });
      cache.set("user", { ...user, targetCurrency: updatedUser.targetCurrency });
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
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            Select your currency
          </label>
          <CurrencyPicker value={currency} onChange={setCurrency} />
        </div>

        {error && (
          <p class="text-red-600 dark:text-red-400 text-sm mb-4">{error}</p>
        )}

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
