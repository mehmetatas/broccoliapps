import type { AccountDto } from "@broccoliapps/nwm-shared";
import { useEffect, useMemo, useState } from "preact/hooks";
import * as client from "../api";
import { getUniqueCurrencies } from "../utils/currencyConversion";
import { useExchangeRates } from "./useExchangeRates";

export const useArchivedAccounts = (targetCurrency: string) => {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [maxValues, setMaxValues] = useState<Record<string, number>>({});
  const [accountHistories, setAccountHistories] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { accounts: accountList } = await client.getAccounts();
        setAccounts(accountList);

        const archivedAccounts = accountList.filter((a) => a.archivedAt);
        const historyPromises = archivedAccounts.map((acc) =>
          client.getAccountHistory(acc.id).then((result) => {
            const values = Object.values(result.history);
            return {
              accountId: acc.id,
              maxValue: values.length > 0 ? Math.max(...values) : 0,
              history: result.history,
            };
          }),
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
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const archivedAccountsList = useMemo(() => {
    return accounts.filter((a) => a.archivedAt);
  }, [accounts]);

  const currenciesToConvert = useMemo(() => {
    return getUniqueCurrencies(archivedAccountsList, targetCurrency);
  }, [archivedAccountsList, targetCurrency]);

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

  const { isLoading: isRatesLoading } = useExchangeRates(currenciesToConvert, targetCurrency, earliestMonth);

  const archivedAccounts = useMemo(() => {
    return archivedAccountsList.sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0));
  }, [archivedAccountsList]);

  const archivedAssets = useMemo(() => archivedAccounts.filter((a) => a.type === "asset"), [archivedAccounts]);
  const archivedDebts = useMemo(() => archivedAccounts.filter((a) => a.type === "debt"), [archivedAccounts]);

  return {
    archivedAccounts,
    archivedAssets,
    archivedDebts,
    maxValues,
    isLoading: isLoading || isRatesLoading,
    error,
  };
};
