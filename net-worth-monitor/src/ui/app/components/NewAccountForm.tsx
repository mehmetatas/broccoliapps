import { cache } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useState } from "preact/hooks";
import type { UpdateFrequency } from "../../../db/accounts";
import type { AuthUser } from "../../../shared/api-contracts";
import { postAccount, putAccountBuckets } from "../../../shared/api-contracts";
import { BucketPicker } from "./BucketPicker";
import { Button } from "./Button";
import { CurrencyPicker } from "./CurrencyPicker";
import { FrequencyPicker } from "./FrequencyPicker";
import { HistoryEditor } from "./HistoryEditor";
import { Input } from "./Input";
import { MoneyInput } from "./MoneyInput";
import { TypeToggle } from "./TypeToggle";
import { ValueChart } from "./ValueChart";

const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

type NewAccountFormProps = {
  onSuccess?: () => void;
  onBack?: () => void;
  showBucketsPicker?: boolean;
};

export const NewAccountForm = ({ onSuccess, onBack, showBucketsPicker = true }: NewAccountFormProps) => {
  const user = cache.get<AuthUser>("user");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [type, setType] = useState<"asset" | "debt">("asset");
  const [currency, setCurrency] = useState(user?.targetCurrency || "USD");
  const [updateFrequency, setUpdateFrequency] = useState<UpdateFrequency>("monthly");
  const [currentValue, setCurrentValue] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<Record<string, number | undefined>>({});
  const [selectedBucketIds, setSelectedBucketIds] = useState<Set<string>>(new Set());
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wantHistory, setWantHistory] = useState(false);

  const handleHistoryChange = (month: string, value: number | undefined) => {
    setHistory((prev) => ({ ...prev, [month]: value }));
  };

  const shouldShowMonth = (monthStr: string, frequency: UpdateFrequency): boolean => {
    if (frequency === "monthly") return true;
    const month = parseInt(monthStr.split("-")[1] ?? "01", 10);
    switch (frequency) {
      case "quarterly":
        return [1, 4, 7, 10].includes(month);
      case "biannually":
        return [1, 7].includes(month);
      case "yearly":
        return month === 1;
      default:
        return true;
    }
  };

  const handleFrequencyChange = (newFrequency: UpdateFrequency) => {
    setUpdateFrequency(newFrequency);
    // Filter history to only keep values for months matching the new frequency
    setHistory((prev) => {
      const filtered: Record<string, number | undefined> = {};
      for (const [month, value] of Object.entries(prev)) {
        if (value !== undefined && shouldShowMonth(month, newFrequency)) {
          filtered[month] = value;
        }
      }
      return filtered;
    });
  };

  const hasAtLeastOneValue = Object.values(history).some((v) => v !== undefined);

  const handleNext = () => {
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    if (currentValue === undefined) {
      setError("Please enter the current value");
      return;
    }
    setError(null);
    // Pre-populate history with current value
    const currentMonth = getCurrentMonth();
    setHistory((prev) => ({ ...prev, [currentMonth]: currentValue }));
    setStep(2);
  };

  const handleQuickCreate = async () => {
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    if (currentValue === undefined) {
      setError("Please enter the current value");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const currentMonth = getCurrentMonth();
    const historyItems = [{ month: currentMonth, value: currentValue }];

    try {
      const account = await postAccount.invoke({
        name: name.trim(),
        type,
        currency,
        updateFrequency,
        historyItems,
      });
      if (showBucketsPicker) {
        setCreatedAccountId(account.id);
        setStep(3);
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          route("/app");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleCreateAccount = async () => {
    if (!hasAtLeastOneValue) {
      setError("Please enter at least one value");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const historyItems: { month: string; value: number }[] = [];
    for (const [month, value] of Object.entries(history)) {
      if (value !== undefined) {
        historyItems.push({ month, value });
      }
    }

    try {
      const account = await postAccount.invoke({
        name: name.trim(),
        type,
        currency,
        updateFrequency,
        historyItems,
      });
      if (showBucketsPicker) {
        setCreatedAccountId(account.id);
        setStep(3);
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          route("/app");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!createdAccountId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedBucketIds.size > 0) {
        await putAccountBuckets.invoke({
          id: createdAccountId,
          bucketIds: Array.from(selectedBucketIds),
        });
      }
      if (onSuccess) {
        onSuccess();
      } else {
        route("/app");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save buckets");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {(step === 2 || step === 3) && (
        <button
          type="button"
          onClick={handleBack}
          class="mb-4 flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {step === 1 && (
        <div class="space-y-6">
          <Input
            label="Name"
            value={name}
            onChange={setName}
            placeholder="e.g., Main Savings"
          />

          <TypeToggle value={type} onChange={setType} />

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Currency
            </label>
            <CurrencyPicker value={currency} onChange={setCurrency} />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Currency and type cannot be changed after creation.
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Update Frequency
            </label>
            <FrequencyPicker value={updateFrequency} onChange={handleFrequencyChange} />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              How often you'll update this account's value.
            </p>
          </div>

          <MoneyInput
            label="Current Value"
            value={currentValue}
            onChange={setCurrentValue}
            currency={currency}
            placeholder="0"
          />

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={wantHistory}
              onChange={(e) => setWantHistory((e.target as HTMLInputElement).checked)}
              class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm text-neutral-600 dark:text-neutral-400">
              I have past monthly values to enter
            </span>
          </label>

          {error && (
            <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button
            onClick={wantHistory ? handleNext : handleQuickCreate}
            disabled={isSubmitting}
            class="w-full"
          >
            {isSubmitting ? "Creating..." : wantHistory ? "Next" : "Add"}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Enter value history for {name}
          </h2>
          <div class="space-y-2">
            <ValueChart data={history} variant={type === "debt" ? "negative" : "default"} currency={currency} />
            <HistoryEditor
              history={history}
              onChange={handleHistoryChange}
              currency={currency}
              updateFrequency={updateFrequency}
            />
          </div>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">
            Enter at least 1 value. You can complete the history later.
          </p>

          {error && (
            <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button
            onClick={handleCreateAccount}
            disabled={isSubmitting || !hasAtLeastOneValue}
            class="w-full"
          >
            {isSubmitting ? "Creating..." : "Next"}
          </Button>
        </div>
      )}

      {step === 3 && (
        <div class="space-y-6">
          <div>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Add <strong>{name}</strong> to buckets to group it with other accounts.
            </p>
            <BucketPicker
              selectedBucketIds={selectedBucketIds}
              onChange={setSelectedBucketIds}
              showHeader={false}
              showManageLink={false}
            />
          </div>

          {error && (
            <p class="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button
            onClick={handleFinish}
            disabled={isSubmitting}
            class="w-full"
          >
            {isSubmitting ? "Saving..." : "Done"}
          </Button>
        </div>
      )}
    </div>
  );
};
