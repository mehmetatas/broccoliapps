import { Archive } from "lucide-preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import type { AccountDto } from "../../../shared/api-contracts/dto";
import { getAccountHistory, getAccounts, getUserSync } from "../api";
import { ArchivedAccountCard, EmptyState, PageHeader } from "../components";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { getUniqueCurrencies } from "../utils/currencyConversion";

export const ArchivedAccountsPage = () => {
  const user = getUserSync();
  const targetCurrency = user?.targetCurrency || "USD";

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [maxValues, setMaxValues] = useState<Record<string, number>>({});
  const [accountHistories, setAccountHistories] = useState<Record<string, Record<string, number>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { accounts: accountList } = await getAccounts();
        setAccounts(accountList);

        // Fetch history for archived accounts to get max values
        const archivedAccounts = accountList.filter((a) => a.archivedAt);
        const historyPromises = archivedAccounts.map((acc) =>
          getAccountHistory(acc.id).then((result) => {
            const values = Object.values(result.history);
            return {
              accountId: acc.id,
              maxValue: values.length > 0 ? Math.max(...values) : 0,
              history: result.history,
            };
          })
        );
        const histories = await Promise.all(historyPromises);

        const maxValuesMap: Record<string, number> = {};
        const historiesMap: Record<string, Record<string, number>> = {};
        for (const { accountId, maxValue, history } of histories) {
          maxValuesMap[accountId] = maxValue;
          historiesMap[accountId] = history;
        }
        setMaxValues(maxValuesMap);
        setAccountHistories(historiesMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get archived accounts for currency extraction
  const archivedAccountsList = useMemo(() => {
    return accounts.filter((a) => a.archivedAt);
  }, [accounts]);

  // Extract unique currencies that need conversion
  const currenciesToConvert = useMemo(() => {
    return getUniqueCurrencies(archivedAccountsList, targetCurrency);
  }, [archivedAccountsList, targetCurrency]);

  // Find earliest month from account histories
  const earliestMonth = useMemo(() => {
    let earliest: string | null = null;
    for (const history of Object.values(accountHistories)) {
      for (const month of Object.keys(history)) {
        if (!earliest || month < earliest) {
          earliest = month;
        }
      }
    }
    return earliest;
  }, [accountHistories]);

  // Fetch exchange rates (caches them for MoneyDisplay to use)
  const { loading: ratesLoading } = useExchangeRates(
    currenciesToConvert,
    targetCurrency,
    earliestMonth
  );

  const archivedAccounts = archivedAccountsList
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));

  const archivedAssets = archivedAccounts.filter((a) => a.type === "asset");
  const archivedDebts = archivedAccounts.filter((a) => a.type === "debt");

  if (loading || ratesLoading) {
    return (
      <div>
        <PageHeader title="Archived" backHref="/" />
        <p class="text-neutral-500 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Archived" backHref="/" />
        <p class="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Archived" backHref="/" />

      {archivedAccounts.length === 0 ? (
        <EmptyState
          icon={<Archive size={48} />}
          title="No archived accounts"
          description="When you archive an asset or debt, it will appear here. Archiving hides it from your dashboard while preserving your net worth history."
        />
      ) : (
        <div class="space-y-8">
          {archivedAssets.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Archived Assets
              </h2>
              <div class="space-y-3">
                {archivedAssets.map((asset) => (
                  <ArchivedAccountCard
                    key={asset.id}
                    account={asset}
                    maxValue={maxValues[asset.id] ?? 0}
                  />
                ))}
              </div>
            </section>
          )}

          {archivedDebts.length > 0 && (
            <section>
              <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Archived Debts
              </h2>
              <div class="space-y-3">
                {archivedDebts.map((debt) => (
                  <ArchivedAccountCard
                    key={debt.id}
                    account={debt}
                    maxValue={maxValues[debt.id] ?? 0}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
