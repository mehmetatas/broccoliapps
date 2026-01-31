import { preferences } from "@broccoliapps/browser";
import { route } from "preact-router";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { AccountDto, BucketDto } from "../../../shared/api-contracts/dto";
import { getDashboard } from "../api";
import { AccountList, BucketFilterPills, HomePageSkeleton, MoneyDisplay, NewAccountForm, ValueChart } from "../components";
import { useExchangeRates } from "../hooks/useExchangeRates";
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

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [latestValues, setLatestValues] = useState<Record<string, number>>({});
  const [accountHistories, setAccountHistories] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<BucketDto[]>([]);
  const [accountsByBucket, setAccountsByBucket] = useState<Record<string, string[]>>({});
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null); // null = "Net Worth" (all accounts)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { accounts: accountList, buckets: bucketList } = await getDashboard();
        setAccounts(accountList);
        setBuckets(bucketList);

        // Build bucket -> accountIds map from already-fetched bucket data
        const bucketAccountsMap: Record<string, string[]> = {};
        for (const bucket of bucketList) {
          bucketAccountsMap[bucket.id] = bucket.accountIds ?? [];
        }
        setAccountsByBucket(bucketAccountsMap);

        // Extract latest value for each account and build accountValuesByMonth
        const values: Record<string, number> = {};
        const accountValuesByMonth: Record<string, Record<string, number>> = {};

        for (const account of accountList) {
          const history = account.history ?? {};
          accountValuesByMonth[account.id] = history;

          // Get latest value by finding max month
          const months = Object.keys(history).sort((a, b) => b.localeCompare(a));
          if (months.length > 0) {
            const latestMonth = months[0]!;
            values[account.id] = history[latestMonth]!;
          }
        }
        setLatestValues(values);
        setAccountHistories(accountValuesByMonth);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
  const { rates: exchangeRates, loading: ratesLoading } = useExchangeRates(
    currenciesToConvert,
    targetCurrency,
    earliestMonth
  );

  // Filter accounts based on selected bucket (hide archived accounts from display)
  const filteredAccounts = useMemo(() => {
    const activeAccounts = accounts.filter((a) => !a.archivedAt);
    if (selectedBucketId === null) {
      // "Net Worth" selected - show all active accounts
      return activeAccounts;
    }
    const bucketAccountIds = accountsByBucket[selectedBucketId] || [];
    return activeAccounts.filter((a) => bucketAccountIds.includes(a.id));
  }, [accounts, selectedBucketId, accountsByBucket]);

  // Get all accounts for net worth calculation (including archived)
  const accountsForNetWorth = useMemo(() => {
    if (selectedBucketId === null) {
      // "Net Worth" selected - include all accounts (active + archived)
      return accounts;
    }
    // For bucket filter, include both active and archived accounts in that bucket
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

  if (loading || ratesLoading) {
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
  const currentNetWorth = latestMonth ? (netWorthData[latestMonth] ?? 0) : 0;
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
