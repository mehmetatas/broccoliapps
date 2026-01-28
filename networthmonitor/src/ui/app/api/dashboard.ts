import { cache } from "@broccoliapps/browser";
import { getDashboard as getDashboardApi } from "../../../shared/api-contracts";
import { setAllAccountsInCache } from "./accounts";
import { CACHE_KEYS, sessionStorage } from "./cache";

type DashboardResponse = Awaited<ReturnType<typeof getDashboardApi.invoke>>;
type Account = DashboardResponse["accounts"][number];
type Bucket = DashboardResponse["buckets"][number];

// GET /dashboard - populates both caches
export const getDashboard = async (): Promise<DashboardResponse> => {
  const dashboardFetched = cache.get<boolean>(CACHE_KEYS.dashboardFetched, sessionStorage);

  if (dashboardFetched) {
    const accountKeys = cache.keys(CACHE_KEYS.accountPrefix, sessionStorage);
    const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage);

    if (buckets) {
      const accounts: Account[] = [];
      for (const key of accountKeys) {
        const account = cache.get<Account>(key, sessionStorage);
        if (account) accounts.push(account);
      }
      return { accounts, buckets };
    }
  }

  const data = await getDashboardApi.invoke({});
  setAllAccountsInCache(data.accounts);
  cache.set(CACHE_KEYS.buckets, data.buckets, undefined, sessionStorage);
  cache.set(CACHE_KEYS.dashboardFetched, true, undefined, sessionStorage);
  return data;
};
