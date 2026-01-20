import { CreditCard } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { Account } from "../../../db/accounts";
import { getAccountHistory, getAccounts } from "../../../shared/api-contracts";
import { PageHeader } from "../components";
import { AppLink } from "../SpaApp";

export const ClosedDebtsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [maxValues, setMaxValues] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accountList = await getAccounts.invoke({});
        setAccounts(accountList);

        // Fetch history for closed debts to get max values
        const closedDebtAccounts = accountList.filter((a) => a.type === "debt" && a.closedAt);
        const historyPromises = closedDebtAccounts.map((acc) =>
          getAccountHistory.invoke({ id: acc.id }).then((items) => ({
            accountId: acc.id,
            maxValue: items.length > 0 ? Math.max(...items.map((item) => item.value)) : 0,
          }))
        );
        const histories = await Promise.all(historyPromises);

        const maxValuesMap: Record<string, number> = {};
        for (const { accountId, maxValue } of histories) {
          maxValuesMap[accountId] = maxValue;
        }
        setMaxValues(maxValuesMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const closedDebts = accounts
    .filter((a) => a.type === "debt" && a.closedAt)
    .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0));

  const totalClosedDebt = useMemo(() => {
    return closedDebts.reduce((sum, debt) => sum + (maxValues[debt.id] ?? 0), 0);
  }, [closedDebts, maxValues]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Closed Debts" backHref="/" />
        <p class="text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Closed Debts" backHref="/" />
        <p class="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Closed Debts" backHref="/" />

      {closedDebts.length === 0 ? (
        <div class="text-center py-12">
          <CreditCard size={48} class="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
          <p class="text-neutral-500 dark:text-neutral-400">
            No closed debts yet.
          </p>
          <p class="text-sm text-neutral-400 dark:text-neutral-500 mt-2">
            When you pay off a debt completely, you can close it to hide it from your home page while preserving the history.
          </p>
        </div>
      ) : (
        <>
          <div class="mb-6 text-center">
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Total Debt Paid Off</p>
            <p class="text-3xl font-bold text-green-600 dark:text-green-400">
              ${totalClosedDebt.toLocaleString()}
            </p>
          </div>
          <div class="space-y-3">
            {closedDebts.map((debt) => (
              <AppLink
                key={debt.id}
                href={`/accounts/${debt.id}`}
                class="flex items-center gap-4 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
              >
                <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400">
                  <CreditCard size={20} />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {debt.name}
                  </p>
                  <p class="text-sm text-neutral-500 dark:text-neutral-400">
                    Closed on {new Date(debt.closedAt!).toLocaleDateString()}
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-semibold text-green-600 dark:text-green-400">
                    ${(maxValues[debt.id] ?? 0).toLocaleString()}
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400">paid off</p>
                </div>
              </AppLink>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
