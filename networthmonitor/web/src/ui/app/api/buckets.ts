import { cache } from "@broccoliapps/browser";
import {
  deleteBucket as deleteBucketApi,
  getBucketAccounts as getBucketAccountsApi,
  getBuckets as getBucketsApi,
  getDashboard as getDashboardApi,
  patchBucket as patchBucketApi,
  postBucket as postBucketApi,
  putBucketAccounts as putBucketAccountsApi,
} from "../../../shared/api-contracts";
import { CACHE_KEYS, sessionStorage } from "./cache";

type DashboardResponse = Awaited<ReturnType<typeof getDashboardApi.invoke>>;
type Bucket = DashboardResponse["buckets"][number];
type Account = DashboardResponse["accounts"][number];
type BucketsResponse = Awaited<ReturnType<typeof getBucketsApi.invoke>>;
type BucketAccountsResponse = Awaited<ReturnType<typeof getBucketAccountsApi.invoke>>;

// GET /buckets - list all buckets
export const getBuckets = async (): Promise<BucketsResponse> => {
  // Only use cache if dashboard was fetched (so we know we have all buckets)
  const dashboardFetched = cache.get<boolean>(CACHE_KEYS.dashboardFetched, sessionStorage);
  if (dashboardFetched) {
    const cached = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage);
    if (cached) return { buckets: cached };
  }

  const data = await getBucketsApi.invoke();
  cache.set(CACHE_KEYS.buckets, data.buckets, undefined, sessionStorage);
  cache.set(CACHE_KEYS.dashboardFetched, true, undefined, sessionStorage);
  return data;
};

// GET /buckets/:id/accounts - get accounts in a bucket
export const getBucketAccounts = async (id: string): Promise<BucketAccountsResponse> => {
  const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage);

  if (buckets) {
    const bucket = buckets.find(b => b.id === id);
    if (bucket?.accountIds) {
      const bucketAccounts: Account[] = [];
      for (const accountId of bucket.accountIds) {
        const account = cache.get<Account>(CACHE_KEYS.account(accountId), sessionStorage);
        if (account) bucketAccounts.push(account);
      }
      if (bucketAccounts.length === bucket.accountIds.length) {
        return { accounts: bucketAccounts };
      }
    }
  }

  const data = await getBucketAccountsApi.invoke({ id });

  // Update accountIds in buckets cache
  const existing = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage) ?? [];
  const accountIds = data.accounts.map(a => a.id);
  cache.set(CACHE_KEYS.buckets, existing.map(b =>
    b.id === id ? { ...b, accountIds } : b
  ), undefined, sessionStorage);

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
  const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage) ?? [];
  cache.set(CACHE_KEYS.buckets, [...buckets, bucket], undefined, sessionStorage);
};

const updateBucketInCache = (bucket: Bucket) => {
  const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage) ?? [];
  cache.set(CACHE_KEYS.buckets, buckets.map(b => b.id === bucket.id ? bucket : b), undefined, sessionStorage);
};

const removeBucketFromCache = (id: string) => {
  const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage) ?? [];
  cache.set(CACHE_KEYS.buckets, buckets.filter(b => b.id !== id), undefined, sessionStorage);
};

const updateBucketAccountIds = (id: string, accountIds: string[]) => {
  const buckets = cache.get<Bucket[]>(CACHE_KEYS.buckets, sessionStorage) ?? [];
  cache.set(CACHE_KEYS.buckets, buckets.map(b => b.id === id ? { ...b, accountIds } : b), undefined, sessionStorage);
};
