import { preferences } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useEffect, useMemo, useState } from "preact/hooks";
import { AccountList, BucketFilterPills, HomePageSkeleton, MoneyDisplay, NewAccountForm, ValueChart } from "../components";
import { useDashboard, useExchangeRates } from "../hooks";
import { convertLatestValues, getEarliestMonth, getUniqueCurrencies } from "../utils/currencyConversion";
import { getCurrentMonth } from "../utils/dateUtils";
import { calculateNetWorthWithConversion } from "../utils/historyUtils";

export const HomePage = () => {
  // Redirect to onboarding if user has no currency set
  const prefs = preferences.getAllSync();
  useEffect(() => {
    if (prefs && !prefs.targetCurrency) {
      route("/app/onboarding");
    }
  }, [prefs]);

  const { accounts, buckets, latestValues, accountHistories, accountsByBucket, isLoading, error } = useDashboard();
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null);

  const targetCurrency = (prefs?.targetCurrency as string) || "USD";

  // Extract unique currencies that need conversion
  const currenciesToConvert = useMemo(() => {
    return getUniqueCurrencies(accounts, targetCurrency);
  }, [accounts, targetCurrency]);

  // Find earliest month from account histories
  const earliestMonth = useMemo(() => {
    return getEarliestMonth(accountHistories);
  }, [accountHistories]);

  // Fetch exchange rates for all currencies
  const { rates: exchangeRates, isLoading: isRatesLoading } = useExchangeRates(
    currenciesToConvert,
    targetCurrency,
    earliestMonth
  );

  // Filter accounts based on selected bucket (hide archived accounts from display)
  const filteredAccounts = useMemo(() => {
    const activeAccounts = accounts.filter((a) => !a.archivedAt);
    if (selectedBucketId === null) {
      return activeAccounts;
    }
    const bucketAccountIds = accountsByBucket[selectedBucketId] || [];
    return activeAccounts.filter((a) => bucketAccountIds.includes(a.id));
  }, [accounts, selectedBucketId, accountsByBucket]);

  // Get all accounts for net worth calculation (including archived)
  const accountsForNetWorth = useMemo(() => {
    if (selectedBucketId === null) {
      return accounts;
    }
    const bucketAccountIds = accountsByBucket[selectedBucketId] || [];
    return accounts.filter((a) => bucketAccountIds.includes(a.id));
  }, [accounts, selectedBucketId, accountsByBucket]);

  // Calculate net worth data with currency conversion
  const netWorthData = useMemo(() => {
    if (!exchangeRates) {
      return {};
    }
    return calculateNetWorthWithConversion(
      accountsForNetWorth,
      accountHistories,
      exchangeRates,
      targetCurrency
    );
  }, [accountsForNetWorth, accountHistories, exchangeRates, targetCurrency]);

  // Convert latest values to target currency
  const convertedLatestValues = useMemo(() => {
    if (!exchangeRates) {
      return {};
    }
    const currentMonth = getCurrentMonth();
    return convertLatestValues(
      accounts,
      latestValues,
      currentMonth,
      exchangeRates,
      targetCurrency
    );
  }, [accounts, latestValues, exchangeRates, targetCurrency]);

  // Filtered latest values for display (converted)
  const filteredLatestValues = useMemo(() => {
    const result: Record<string, number> = {};
    for (const account of filteredAccounts) {
      const value = convertedLatestValues[account.id];
      if (value !== undefined) {
        result[account.id] = value;
      }
    }
    return result;
  }, [filteredAccounts, convertedLatestValues]);

  // Filtered original values for display
  const filteredOriginalValues = useMemo(() => {
    const result: Record<string, number> = {};
    for (const account of filteredAccounts) {
      const value = latestValues[account.id];
      if (value !== undefined) {
        result[account.id] = value;
      }
    }
    return result;
  }, [filteredAccounts, latestValues]);

  if (isLoading || isRatesLoading) {
    return <HomePageSkeleton />;
  }

  if (error) {
    return <p class="text-red-600 dark:text-red-400">{error}</p>;
  }

  if (accounts.length === 0) {
    return (
      <div>
        <p class="text-neutral-600 dark:text-neutral-400 mb-6 text-center">
          No assets or debts yet. Add your first one to start tracking your net worth.
        </p>
        <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
          <NewAccountForm onSuccess={() => window.location.reload()} />
        </div>
      </div>
    );
  }

  const hasFilteredAccounts = filteredAccounts.length > 0;
  const months = Object.keys(netWorthData).sort((a, b) => b.localeCompare(a));
  const latestMonth = months[0];
  const currentNetWorth = latestMonth ? netWorthData[latestMonth] ?? 0 : 0;
  const isNegative = currentNetWorth < 0;

  return (
    <div>
      <BucketFilterPills
        buckets={buckets}
        selectedBucketId={selectedBucketId}
        onSelect={setSelectedBucketId}
      />

      <div class="mb-4">
        <MoneyDisplay amount={currentNetWorth} currency={targetCurrency} size="xl" />
      </div>

      <div className="mb-6">
        <ValueChart
          data={netWorthData}
          variant={isNegative ? "negative" : "default"}
          currency={targetCurrency}
        />
      </div>

      {
        !hasFilteredAccounts && selectedBucketId !== null && (
          <p class="text-center text-neutral-500 dark:text-neutral-400 mb-6">
            No assets or debts in this bucket yet.
          </p>
        )
      }

      {
        filteredAccounts.length > 0 && (
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AccountList
              title="Assets"
              accounts={filteredAccounts.filter((a) => a.type === "asset")}
              latestValues={filteredLatestValues}
              originalValues={filteredOriginalValues}
              displayCurrency={targetCurrency}
            />
            <AccountList
              title="Debts"
              accounts={filteredAccounts.filter((a) => a.type === "debt")}
              latestValues={filteredLatestValues}
              originalValues={filteredOriginalValues}
              displayCurrency={targetCurrency}
            />
          </div>
        )
      }
    </div >
  );
};
