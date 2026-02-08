import { Button, Input, preferences } from "@broccoliapps/browser";
import type { BucketDto, UpdateFrequency } from "@broccoliapps/nwm-shared";
import { useState } from "preact/hooks";
import { route } from "preact-router";
import * as client from "../api";
import { getCurrentMonth, shouldShowMonth } from "../utils/dateUtils";
import { BucketPicker } from "./BucketPicker";
import { CurrencyPicker } from "./CurrencyPicker";
import { FrequencyPicker } from "./FrequencyPicker";
import { HistoryEditor } from "./HistoryEditor";
import { MoneyInput } from "./MoneyInput";
import { TypeToggle } from "./TypeToggle";
import { ValueChart } from "./ValueChart";

type NewAccountFormProps = {
  onSuccess?: () => void;
  onBack?: () => void;
};

export const NewAccountForm = ({ onSuccess, onBack }: NewAccountFormProps) => {
  const [viewMode, setViewMode] = useState<"quick" | "advanced">("quick");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [type, setType] = useState<"asset" | "debt">("asset");
  const [currency, setCurrency] = useState((preferences.getAllSync()?.targetCurrency as string) || "USD");
  const [updateFrequency, setUpdateFrequency] = useState<UpdateFrequency>("monthly");
  const [currentValue, setCurrentValue] = useState<number | undefined>(undefined);
  const [history, setHistory] = useState<Record<string, number | undefined>>({});
  const [selectedBucketIds, setSelectedBucketIds] = useState<Set<string>>(new Set());
  const [preloadedBuckets, setPreloadedBuckets] = useState<BucketDto[] | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createAnother, setCreateAnother] = useState(false);

  const handleHistoryChange = (month: string, value: number | undefined) => {
    setHistory((prev) => ({ ...prev, [month]: value }));
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

  const handleNext = async () => {
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
    // Preload buckets for step 3
    if (!preloadedBuckets) {
      client
        .getBuckets()
        .then((r) => setPreloadedBuckets(r.buckets))
        .catch(console.error);
    }
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

    try {
      await client.postAccount({
        name: name.trim(),
        type,
        currency,
        updateFrequency,
        history: { [currentMonth]: currentValue },
      });
      if (createAnother) {
        setName("");
        setCurrentValue(undefined);
        setError(null);
      } else if (onSuccess) {
        onSuccess();
      } else {
        route("/app");
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

  const handleHistoryNext = () => {
    if (!hasAtLeastOneValue) {
      setError("Please enter at least one value");
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);

    // Filter out undefined values for the API
    const historyRecord: Record<string, number> = {};
    for (const [month, value] of Object.entries(history)) {
      if (value !== undefined) {
        historyRecord[month] = value;
      }
    }

    try {
      const { account } = await client.postAccount({
        name: name.trim(),
        type,
        currency,
        updateFrequency,
        history: historyRecord,
      });

      if (selectedBucketIds.size > 0) {
        await client.putAccountBuckets({
          id: account.id,
          bucketIds: Array.from(selectedBucketIds),
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        route("/app");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {viewMode === "quick" && step === 1 && (
        <div class="space-y-6">
          <Input label="Name" value={name} onInput={(e) => setName(e.currentTarget.value)} placeholder="e.g., Main Savings" />

          <TypeToggle value={type} onChange={setType} />

          <MoneyInput label="Current Value" value={currentValue} onChange={setCurrentValue} currency={currency} placeholder="0" />

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createAnother}
              onChange={(e) => setCreateAnother((e.target as HTMLInputElement).checked)}
              class="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-indigo-600 focus:ring-indigo-500"
            />
            <span class="text-sm text-neutral-600 dark:text-neutral-400">Create another</span>
          </label>

          {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button onClick={handleQuickCreate} disabled={isSubmitting} class="w-full">
            {isSubmitting ? "Creating..." : "Add"}
          </Button>

          <div class="text-center">
            <button
              type="button"
              onClick={() => setViewMode("advanced")}
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Advanced options
            </button>
          </div>
        </div>
      )}

      {viewMode === "advanced" && step === 1 && (
        <div class="space-y-6">
          <Input label="Name" value={name} onInput={(e) => setName(e.currentTarget.value)} placeholder="e.g., Main Savings" />

          <TypeToggle value={type} onChange={setType} />

          <MoneyInput label="Current Value" value={currentValue} onChange={setCurrentValue} currency={currency} placeholder="0" />

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Currency</label>
            <CurrencyPicker value={currency} onChange={setCurrency} />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">Currency and type cannot be changed after creation.</p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Update Frequency</label>
            <FrequencyPicker value={updateFrequency} onChange={handleFrequencyChange} />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">How often you'll update this account's value.</p>
          </div>

          {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button onClick={handleNext} disabled={isSubmitting} class="w-full">
            Next
          </Button>

          <div class="text-center">
            <button
              type="button"
              onClick={() => setViewMode("quick")}
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Quick create
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div class="space-y-6">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Enter value history for {name}</h2>
          <div class="space-y-2">
            <ValueChart data={history} variant={type === "debt" ? "negative" : "default"} currency={currency} />
            <HistoryEditor history={history} onChange={handleHistoryChange} currency={currency} updateFrequency={updateFrequency} />
          </div>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">Enter at least 1 value. You can complete the history later.</p>

          {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div class="flex gap-3">
            <Button onClick={handleBack} variant="secondary" class="flex-1">
              Back
            </Button>
            <Button onClick={handleHistoryNext} disabled={!hasAtLeastOneValue} class="flex-1">
              Next
            </Button>
          </div>
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
              preloadedBuckets={preloadedBuckets}
              onBucketsChange={setPreloadedBuckets}
            />
          </div>

          {error && <p class="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div class="flex gap-3">
            <Button onClick={handleBack} variant="secondary" disabled={isSubmitting} class="flex-1">
              Back
            </Button>
            <Button onClick={handleCreate} disabled={isSubmitting} class="flex-1">
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
