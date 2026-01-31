import { useEffect, useState } from "preact/hooks";
import type { AccountDto, BucketDto } from "@broccoliapps/nwm-shared";
import { getDashboard } from "../api";

type DashboardData = {
  accounts: AccountDto[];
  buckets: BucketDto[];
  latestValues: Record<string, number>;
  accountHistories: Record<string, Record<string, number>>;
  accountsByBucket: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
};

export const useDashboard = (): DashboardData => {
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [buckets, setBuckets] = useState<BucketDto[]>([]);
  const [latestValues, setLatestValues] = useState<Record<string, number>>({});
  const [accountHistories, setAccountHistories] = useState<Record<string, Record<string, number>>>({});
  const [accountsByBucket, setAccountsByBucket] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { accounts: accountList, buckets: bucketList } = await getDashboard();
        setAccounts(accountList);
        setBuckets(bucketList);

        // Build bucket -> accountIds map
        const bucketAccountsMap: Record<string, string[]> = {};
        for (const bucket of bucketList) {
          bucketAccountsMap[bucket.id] = bucket.accountIds ?? [];
        }
        setAccountsByBucket(bucketAccountsMap);

        // Extract latest value for each account and build histories map
        const values: Record<string, number> = {};
        const histories: Record<string, Record<string, number>> = {};

        for (const account of accountList) {
          const history = account.history ?? {};
          histories[account.id] = history;

          const months = Object.keys(history).sort((a, b) => b.localeCompare(a));
          if (months.length > 0) {
            values[account.id] = history[months[0]!]!;
          }
        }
        setLatestValues(values);
        setAccountHistories(histories);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return { accounts, buckets, latestValues, accountHistories, accountsByBucket, isLoading, error };
};
