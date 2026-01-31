import { getDashboard as getDashboardApi } from "../api-contracts";
import { setAllAccountsInCache } from "./accounts";
import { CACHE_KEYS, getCacheExpiry } from "./cache";
import { getCache } from "./init";

type DashboardResponse = Awaited<ReturnType<typeof getDashboardApi.invoke>>;
type Account = DashboardResponse["accounts"][number];
type Bucket = DashboardResponse["buckets"][number];

// GET /dashboard - populates both caches
export const getDashboard = async (): Promise<DashboardResponse> => {
  const dashboardFetched = getCache().get<boolean>(CACHE_KEYS.dashboardFetched);

  if (dashboardFetched) {
    const accountKeys = getCache().keys(CACHE_KEYS.accountPrefix);
    const buckets = getCache().get<Bucket[]>(CACHE_KEYS.buckets);

    if (buckets) {
      const accounts: Account[] = [];
      for (const key of accountKeys) {
        const account = getCache().get<Account>(key);
        if (account) accounts.push(account);
      }
      return { accounts, buckets };
    }
  }

  const data = await getDashboardApi.invoke({});
  setAllAccountsInCache(data.accounts);
  getCache().set(CACHE_KEYS.buckets, data.buckets, getCacheExpiry());
  getCache().set(CACHE_KEYS.dashboardFetched, true, getCacheExpiry());
  return data;
};
