import {
  deleteBucket as deleteBucketApi,
  getBucketAccounts as getBucketAccountsApi,
  getBuckets as getBucketsApi,
  patchBucket as patchBucketApi,
  postBucket as postBucketApi,
  putBucketAccounts as putBucketAccountsApi,
} from "../api-contracts";
import { CACHE_KEYS, getCacheExpiry } from "./cache";
import { getCache } from "./init";

type DashboardResponse = Awaited<ReturnType<typeof import("../api-contracts").getDashboard.invoke>>;
type Bucket = DashboardResponse["buckets"][number];
type Account = DashboardResponse["accounts"][number];
type BucketsResponse = Awaited<ReturnType<typeof getBucketsApi.invoke>>;
type BucketAccountsResponse = Awaited<ReturnType<typeof getBucketAccountsApi.invoke>>;

// GET /buckets - list all buckets
export const getBuckets = async (): Promise<BucketsResponse> => {
  const dashboardFetched = getCache().get<boolean>(CACHE_KEYS.dashboardFetched);
  if (dashboardFetched) {
    const cached = getCache().get<Bucket[]>(CACHE_KEYS.buckets);
    if (cached) {
      return { buckets: cached };
    }
  }

  const data = await getBucketsApi.invoke();
  getCache().set(CACHE_KEYS.buckets, data.buckets, getCacheExpiry());
  getCache().set(CACHE_KEYS.dashboardFetched, true, getCacheExpiry());
  return data;
};

// GET /buckets/:id/accounts - get accounts in a bucket
export const getBucketAccounts = async (id: string): Promise<BucketAccountsResponse> => {
  const buckets = getCache().get<Bucket[]>(CACHE_KEYS.buckets);

  if (buckets) {
    const bucket = buckets.find(b => b.id === id);
    if (bucket?.accountIds) {
      const bucketAccounts: Account[] = [];
      for (const accountId of bucket.accountIds) {
        const account = getCache().get<Account>(CACHE_KEYS.account(accountId));
        if (account) {
          bucketAccounts.push(account);
        }
      }
      if (bucketAccounts.length === bucket.accountIds.length) {
        return { accounts: bucketAccounts };
      }
    }
  }

  const data = await getBucketAccountsApi.invoke({ id });

  const existing = getCache().get<Bucket[]>(CACHE_KEYS.buckets) ?? [];
  const accountIds = data.accounts.map(a => a.id);
  getCache().set(CACHE_KEYS.buckets, existing.map(b =>
    b.id === id ? { ...b, accountIds } : b
  ), getCacheExpiry());

  return data;
};

// POST /buckets - create bucket
export const postBucket = async (
  ...args: Parameters<typeof postBucketApi.invoke>
): Promise<Awaited<ReturnType<typeof postBucketApi.invoke>>> => {
  const result = await postBucketApi.invoke(...args);
  addBucketToCache(result.bucket);
  return result;
};

// PATCH /buckets/:id - update bucket
export const patchBucket = async (
  ...args: Parameters<typeof patchBucketApi.invoke>
): Promise<Awaited<ReturnType<typeof patchBucketApi.invoke>>> => {
  const result = await patchBucketApi.invoke(...args);
  updateBucketInCache(result.bucket);
  return result;
};

// DELETE /buckets/:id - delete bucket
export const deleteBucket = async (
  ...args: Parameters<typeof deleteBucketApi.invoke>
): Promise<void> => {
  await deleteBucketApi.invoke(...args);
  removeBucketFromCache(args[0]!.id);
};

// PUT /buckets/:id/accounts - set accounts for bucket
export const putBucketAccounts = async (
  id: string,
  accountIds: string[]
): Promise<void> => {
  await putBucketAccountsApi.invoke({ id, accountIds });
  updateBucketAccountIds(id, accountIds);
};

// Helper functions
const addBucketToCache = (bucket: Bucket) => {
  const buckets = getCache().get<Bucket[]>(CACHE_KEYS.buckets) ?? [];
  getCache().set(CACHE_KEYS.buckets, [...buckets, bucket], getCacheExpiry());
};

const updateBucketInCache = (bucket: Bucket) => {
  const buckets = getCache().get<Bucket[]>(CACHE_KEYS.buckets) ?? [];
  getCache().set(CACHE_KEYS.buckets, buckets.map(b => b.id === bucket.id ? bucket : b), getCacheExpiry());
};

const removeBucketFromCache = (id: string) => {
  const buckets = getCache().get<Bucket[]>(CACHE_KEYS.buckets) ?? [];
  getCache().set(CACHE_KEYS.buckets, buckets.filter(b => b.id !== id), getCacheExpiry());
};

const updateBucketAccountIds = (id: string, accountIds: string[]) => {
  const buckets = getCache().get<Bucket[]>(CACHE_KEYS.buckets) ?? [];
  getCache().set(CACHE_KEYS.buckets, buckets.map(b => b.id === id ? { ...b, accountIds } : b), getCacheExpiry());
};
