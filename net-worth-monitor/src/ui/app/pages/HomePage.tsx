import { cache } from "@broccoliapps/browser";
import { Check } from "lucide-preact";
import { route } from "preact-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Account } from "../../../db/accounts";
import type { Bucket } from "../../../db/buckets";
import type { AuthUser } from "../../../shared/api-contracts";
import { getAccountHistory, getAccounts, getBucketAccounts, getBuckets } from "../../../shared/api-contracts";
import { AccountList, NewAccountForm, ValueChart } from "../components";
import { getCurrencySymbol } from "../currency";

export const HomePage = () => {
  // Redirect to onboarding if user has no currency set
  const user = cache.get<AuthUser>("user");
  useEffect(() => {
    if (user && !user.targetCurrency) {
      route("/app/onboarding");
    }
  }, [user]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [latestValues, setLatestValues] = useState<Record<string, number>>({});
  const [accountHistories, setAccountHistories] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [accountsByBucket, setAccountsByBucket] = useState<Record<string, string[]>>({});
  const [selectedBucketId, setSelectedBucketId] = useState<string | null>(null); // null = "Net Worth" (all accounts)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountList, bucketList] = await Promise.all([
          getAccounts.invoke({}),
          getBuckets.invoke(),
        ]);
        setAccounts(accountList);
        setBuckets(bucketList);

        // Fetch accounts for each bucket
        const bucketAccountsMap: Record<string, string[]> = {};
        await Promise.all(
          bucketList.map(async (bucket) => {
            const bucketAccounts = await getBucketAccounts.invoke({ id: bucket.id });
            bucketAccountsMap[bucket.id] = bucketAccounts.map((a) => a.id);
          })
        );
        setAccountsByBucket(bucketAccountsMap);

        // Fetch history for each account in parallel
        const historyPromises = accountList.map((acc) =>
          getAccountHistory.invoke({ id: acc.id }).then((items) => ({
            accountId: acc.id,
            items,
          }))
        );
        const histories = await Promise.all(historyPromises);

        // Extract latest value for each account
        const values: Record<string, number> = {};
        for (const { accountId, items } of histories) {
          if (items.length > 0) {
            // Sort by month descending and get the latest
            const sorted = [...items].sort((a, b) => b.month.localeCompare(a.month));
            const latest = sorted[0];
            if (latest) {
              values[accountId] = latest.value;
            }
          }
        }
        setLatestValues(values);

        // Calculate net worth by month (carry forward last known value for missing months)
        // Get current month
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Find earliest month from data
        let earliestMonth = currentMonth;
        for (const { items } of histories) {
          for (const item of items) {
            if (item.month < earliestMonth) {
              earliestMonth = item.month;
            }
          }
        }

        // Generate all months from earliest to current
        const sortedMonths: string[] = [];
        let iterMonth = earliestMonth;
        while (iterMonth <= currentMonth) {
          sortedMonths.push(iterMonth);
          const [year, month] = iterMonth.split("-").map(Number);
          const nextDate = new Date(year!, month!); // month is already 1-based, Date expects 0-based so this gives next month
          iterMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
        }

        // Build a map of account values by month (sorted ascending for carry-forward)
        const accountValuesByMonth: Record<string, Record<string, number>> = {};
        for (const { accountId, items } of histories) {
          const valueMap: Record<string, number> = {};
          const sortedItems = [...items].sort((a, b) => a.month.localeCompare(b.month));
          for (const item of sortedItems) {
            valueMap[item.month] = item.value;
          }
          accountValuesByMonth[accountId] = valueMap;
        }
        setAccountHistories(accountValuesByMonth);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter accounts based on selected bucket (hide closed accounts from display)
  const filteredAccounts = useMemo(() => {
    const openAccounts = accounts.filter((a) => !a.closedAt);
    if (selectedBucketId === null) {
      // "Net Worth" selected - show all open accounts
      return openAccounts;
    }
    const bucketAccountIds = accountsByBucket[selectedBucketId] || [];
    return openAccounts.filter((a) => bucketAccountIds.includes(a.id));
  }, [accounts, selectedBucketId, accountsByBucket]);

  // Calculate net worth data for filtered accounts
  const netWorthData = useMemo(() => {
    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Find earliest month from filtered accounts' histories
    let earliestMonth = currentMonth;
    for (const account of filteredAccounts) {
      const history = accountHistories[account.id];
      if (history) {
        for (const month of Object.keys(history)) {
          if (month < earliestMonth) {
            earliestMonth = month;
          }
        }
      }
    }

    // Generate all months from earliest to current
    const sortedMonths: string[] = [];
    let iterMonth = earliestMonth;
    while (iterMonth <= currentMonth) {
      sortedMonths.push(iterMonth);
      const [year, month] = iterMonth.split("-").map(Number);
      const nextDate = new Date(year!, month!);
      iterMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    }

    // Calculate net worth by month with carry-forward
    const netWorthByMonth: Record<string, number> = {};
    const lastKnownValue: Record<string, number> = {};

    for (const month of sortedMonths) {
      let total = 0;
      for (const account of filteredAccounts) {
        const history = accountHistories[account.id];
        if (history && history[month] !== undefined) {
          lastKnownValue[account.id] = history[month];
        }
        const value = lastKnownValue[account.id] ?? 0;
        if (account.type === "asset") {
          total += value;
        } else {
          total -= value;
        }
      }
      netWorthByMonth[month] = total;
    }

    return netWorthByMonth;
  }, [filteredAccounts, accountHistories]);

  // Filtered latest values for display
  const filteredLatestValues = useMemo(() => {
    const result: Record<string, number> = {};
    for (const account of filteredAccounts) {
      const value = latestValues[account.id];
      if (value !== undefined) {
        result[account.id] = value;
      }
    }
    return result;
  }, [filteredAccounts, latestValues]);

  // Sorted buckets for pills (alphabetically)
  const sortedBuckets = useMemo(() => {
    return [...buckets].sort((a, b) => a.name.localeCompare(b.name));
  }, [buckets]);

  // Ref for bucket pills scroll container
  const bucketScrollRef = useRef<HTMLDivElement>(null);

  // Scroll selected bucket to center
  const scrollBucketToCenter = useCallback((element: HTMLButtonElement) => {
    element.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  return (
    <div>
      {/* <PageHeader
        title="Net Worth Monitor"
        action={accounts.length > 0 ? { icon: "plus", href: "/new" } : undefined}
      /> */}

      {loading && (
        <div class="animate-pulse">
          {/* Bucket Pills Skeleton */}
          <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-6">
            <div class="flex gap-2 p-3">
              <div class="h-8 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
              <div class="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
              <div class="h-8 w-28 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
            </div>
          </div>

          {/* Net Worth Value Skeleton */}
          <div class="mb-4">
            <div class="h-10 w-48 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>

          {/* Chart Skeleton */}
          <div class="h-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-6" />

          {/* Assets and Debts Grid Skeleton */}
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assets Skeleton */}
            <div>
              <div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
              <div class="space-y-3">
                <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
              </div>
            </div>
            {/* Debts Skeleton */}
            <div>
              <div class="h-6 w-14 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
              <div class="space-y-3">
                <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
                <div class="h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p class="text-red-600 dark:text-red-400">{error}</p>
      )}

      {!loading && !error && accounts.length === 0 && (
        <div>
          <p class="text-neutral-600 dark:text-neutral-400 mb-6 text-center">
            No assets or debts yet. Add your first one to start tracking your net worth.
          </p>
          <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
            <NewAccountForm onSuccess={() => window.location.reload()} showBucketsPicker={false} />
          </div>
        </div>
      )}

      {!loading && !error && accounts.length > 0 && (
        <>
          {/* Bucket Pills */}
          <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-6">
            <div
              ref={bucketScrollRef}
              class="flex gap-2 p-3 overflow-x-auto scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                type="button"
                onClick={(e) => {
                  setSelectedBucketId(null);
                  scrollBucketToCenter(e.currentTarget);
                }}
                class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 shrink-0 ${selectedBucketId === null
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-500"
                  }`}
              >
                {selectedBucketId === null && <Check size={14} class="shrink-0" />}
                Net Worth
              </button>
              {sortedBuckets.map((bucket) => (
                <button
                  key={bucket.id}
                  type="button"
                  onClick={(e) => {
                    setSelectedBucketId(bucket.id);
                    scrollBucketToCenter(e.currentTarget);
                  }}
                  class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 shrink-0 ${selectedBucketId === bucket.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-500"
                    }`}
                >
                  {selectedBucketId === bucket.id && <Check size={14} class="shrink-0" />}
                  {bucket.name}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const hasFilteredAccounts = filteredAccounts.length > 0;
            const months = Object.keys(netWorthData).sort((a, b) => b.localeCompare(a));
            const latestMonth = months[0];
            const currentNetWorth = latestMonth ? (netWorthData[latestMonth] ?? 0) : 0;
            const isNegative = currentNetWorth < 0;
            return (
              <>
                <div class="mb-4">
                  <span class="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                    {getCurrencySymbol(user?.targetCurrency || "USD")}{currentNetWorth.toLocaleString()}
                  </span>
                  <span class="ml-2 text-lg text-neutral-500 dark:text-neutral-400">
                    {user?.targetCurrency || "USD"}
                  </span>
                </div>
                <ValueChart
                  data={hasFilteredAccounts ? netWorthData : {}}
                  variant={isNegative ? "negative" : "default"}
                  currency={user?.targetCurrency || "USD"}
                />
                {!hasFilteredAccounts && selectedBucketId !== null && (
                  <p class="text-center text-neutral-500 dark:text-neutral-400 mb-6">
                    No assets or debts in this bucket yet.
                  </p>
                )}
              </>
            );
          })()}
          {filteredAccounts.length > 0 && (
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AccountList
                title="Assets"
                accounts={filteredAccounts.filter((a) => a.type === "asset")}
                latestValues={filteredLatestValues}
                accountHistories={accountHistories}
              />
              <AccountList
                title="Debts"
                accounts={filteredAccounts.filter((a) => a.type === "debt")}
                latestValues={filteredLatestValues}
                accountHistories={accountHistories}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
