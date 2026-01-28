import { cache } from "@broccoliapps/browser";
import {
  deleteAccount as deleteAccountApi,
  deleteHistoryItem as deleteHistoryItemApi,
  getAccountBuckets as getAccountBucketsApi,
  getAccountDetail as getAccountDetailApi,
  getAccountHistory as getAccountHistoryApi,
  getAccounts as getAccountsApi,
  getDashboard as getDashboardApi,
  patchAccount as patchAccountApi,
  postAccount as postAccountApi,
  postHistoryItem as postHistoryItemApi,
  putAccountBuckets as putAccountBucketsApi,
} from "../../../shared/api-contracts";
import { CACHE_KEYS, sessionStorage } from "./cache";

type DashboardResponse = Awaited<ReturnType<typeof getDashboardApi.invoke>>;
type Account = DashboardResponse["accounts"][number];
type Bucket = DashboardResponse["buckets"][number];
type AccountsResponse = Awaited<ReturnType<typeof getAccountsApi.invoke>>;
type AccountDetailResponse = Awaited<ReturnType<typeof getAccountDetailApi.invoke>>;
type AccountHistoryResponse = Awaited<ReturnType<typeof getAccountHistoryApi.invoke>>;
type AccountBucketsResponse = Awaited<ReturnType<typeof getAccountBucketsApi.invoke>>;

// GET /accounts - list all accounts
export const getAccounts = async (): Promise<AccountsResponse> => {
  // Only use cache if dashboard was fetched (so we know we have all accounts)
  const dashboardFetched = cache.get<boolean>(CACHE_KEYS.dashboardFetched, sessionStorage);
  if (dashboardFetched) {
    const accounts = getAllAccountsFromCache();
    if (accounts.length > 0) return { accounts };
  }

  const data = await getAccountsApi.invoke({});
  setAllAccountsInCache(data.accounts);
  cache.set(CACHE_KEYS.dashboardFetched, true, undefined, sessionStorage);
  return data;
};

// GET /accounts/:id/detail - get account with all related data
export const getAccountDetail = async (id: string): Promise<AccountDetailResponse> => {
  const account = cache.get<Account>(CACHE_KEYS.account(id), sessionStorage);
  const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage);

  if (account && buckets) {
    const accountBuckets = account.bucketIds
      ? buckets.filter(b => account.bucketIds!.includes(b.id))
      : [];
    return { account, accountBuckets, allBuckets: buckets };
  }

  const data = await getAccountDetailApi.invoke({ id });
  setAccountInCache(data.account);
  cache.set(CACHE_KEYS.buckets, data.allBuckets, undefined, sessionStorage);
  return data;
};

// GET /accounts/:id/history - get history items
export const getAccountHistory = async (id: string): Promise<AccountHistoryResponse> => {
  const account = cache.get<Account>(CACHE_KEYS.account(id), sessionStorage);
  if (account?.history) {
    return { history: account.history };
  }

  const data = await getAccountHistoryApi.invoke({ id });

  if (account) {
    setAccountInCache({ ...account, history: data.history });
  }

  return data;
};

// GET /accounts/:id/buckets - get buckets for an account
export const getAccountBuckets = async (id: string): Promise<AccountBucketsResponse> => {
  const account = cache.get<Account>(CACHE_KEYS.account(id), sessionStorage);
  const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage);

  if (account?.bucketIds && buckets) {
    const accountBuckets = buckets.filter(b => account.bucketIds!.includes(b.id));
    return { buckets: accountBuckets };
  }

  const data = await getAccountBucketsApi.invoke({ id });

  if (account) {
    const bucketIds = data.buckets.map(b => b.id);
    setAccountInCache({ ...account, bucketIds });
  }

  return data;
};

// POST /accounts - create account
export const postAccount = async (
  ...args: Parameters<typeof postAccountApi.invoke>
): Promise<Awaited<ReturnType<typeof postAccountApi.invoke>>> => {
  const result = await postAccountApi.invoke(...args);
  setAccountInCache(result.account);
  return result;
};

// PATCH /accounts/:id - update account
export const patchAccount = async (
  ...args: Parameters<typeof patchAccountApi.invoke>
): Promise<Awaited<ReturnType<typeof patchAccountApi.invoke>>> => {
  const result = await patchAccountApi.invoke(...args);
  setAccountInCache(result.account);
  return result;
};

// DELETE /accounts/:id - delete account
export const deleteAccount = async (
  ...args: Parameters<typeof deleteAccountApi.invoke>
): Promise<void> => {
  await deleteAccountApi.invoke(...args);
  cache.remove(CACHE_KEYS.account(args[0]!.id), sessionStorage);
};

// POST /accounts/:id/history-item - add/update a single history item
export const postHistoryItem = async (
  ...args: Parameters<typeof postHistoryItemApi.invoke>
): Promise<Awaited<ReturnType<typeof postHistoryItemApi.invoke>>> => {
  const result = await postHistoryItemApi.invoke(...args);
  updateAccountHistory(args[0]!.id, result.month, result.value, result.nextUpdate);
  return result;
};

// DELETE /accounts/:id/history-item/:month - delete a single history item
export const deleteHistoryItem = async (
  ...args: Parameters<typeof deleteHistoryItemApi.invoke>
): Promise<Awaited<ReturnType<typeof deleteHistoryItemApi.invoke>>> => {
  const result = await deleteHistoryItemApi.invoke(...args);
  removeAccountHistoryItem(args[0]!.id, args[0]!.month, result.nextUpdate);
  return result;
};

// PUT /accounts/:id/buckets - set buckets for account
export const putAccountBuckets = async (
  ...args: Parameters<typeof putAccountBucketsApi.invoke>
): Promise<void> => {
  await putAccountBucketsApi.invoke(...args);
  updateAccountBucketIds(args[0]!.id, args[0]!.bucketIds);
};

// Helper functions

const getAllAccountsFromCache = (): Account[] => {
  const keys = cache.keys(CACHE_KEYS.accountPrefix, sessionStorage);
  const accounts: Account[] = [];
  for (const key of keys) {
    const account = cache.get<Account>(key, sessionStorage);
    if (account) accounts.push(account);
  }
  return accounts;
};

export const setAllAccountsInCache = (accounts: Account[]) => {
  for (const account of accounts) {
    cache.set(CACHE_KEYS.account(account.id), account, undefined, sessionStorage);
  }
};

const setAccountInCache = (account: Account) => {
  cache.set(CACHE_KEYS.account(account.id), account, undefined, sessionStorage);
};

const updateAccountHistory = (id: string, month: string, value: number, nextUpdate?: string) => {
  const account = cache.get<Account>(CACHE_KEYS.account(id), sessionStorage);
  if (account) {
    setAccountInCache({
      ...account,
      history: { ...account.history, [month]: value },
      nextUpdate: nextUpdate ?? account.nextUpdate,
    });
  }
};

const removeAccountHistoryItem = (id: string, month: string, nextUpdate?: string) => {
  const account = cache.get<Account>(CACHE_KEYS.account(id), sessionStorage);
  if (account) {
    const { [month]: _, ...rest } = account.history ?? {};
    setAccountInCache({
      ...account,
      history: rest,
      nextUpdate: nextUpdate ?? account.nextUpdate,
    });
  }
};

const updateAccountBucketIds = (id: string, bucketIds: string[]) => {
  const account = cache.get<Account>(CACHE_KEYS.account(id), sessionStorage);
  if (account) {
    setAccountInCache({ ...account, bucketIds });
  }
};
