import * as v from "valibot";
import { accountDto, bucketDto, idRequest } from "./dto";

type Infer<T extends v.ObjectEntries> = v.InferOutput<v.ObjectSchema<T, undefined>>;

// ============================================================================
// GET /buckets - list all buckets
// ============================================================================
export const getBucketsResponse = {
  buckets: v.array(v.object(bucketDto)),
};
export type GetBucketsResponse = Infer<typeof getBucketsResponse>;

// ============================================================================
// POST /buckets - create bucket
// ============================================================================
export const postBucketRequest = {
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
};
export type PostBucketRequest = v.InferOutput<v.ObjectSchema<typeof postBucketRequest, undefined>>;

export const postBucketResponse = {
  bucket: v.object(bucketDto),
};
export type PostBucketResponse = v.InferOutput<v.ObjectSchema<typeof postBucketResponse, undefined>>;

// ============================================================================
// PATCH /buckets/:id - update bucket
// ============================================================================
export const patchBucketRequest = {
  id: v.string(),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
};
export type PatchBucketRequest = v.InferOutput<v.ObjectSchema<typeof patchBucketRequest, undefined>>;

export const patchBucketResponse = {
  bucket: v.object(bucketDto),
};
export type PatchBucketResponse = v.InferOutput<v.ObjectSchema<typeof patchBucketResponse, undefined>>;

// ============================================================================
// DELETE /buckets/:id - delete bucket
// ============================================================================
export const deleteBucketRequest = idRequest;
export type DeleteBucketRequest = v.InferOutput<v.ObjectSchema<typeof deleteBucketRequest, undefined>>;

// ============================================================================
// GET /buckets/:id/accounts - get accounts in a bucket
// ============================================================================
export const getBucketAccountsRequest = idRequest;
export type GetBucketAccountsRequest = v.InferOutput<v.ObjectSchema<typeof getBucketAccountsRequest, undefined>>;

export const getBucketAccountsResponse = {
  accounts: v.array(v.object(accountDto)),
};
export type GetBucketAccountsResponse = v.InferOutput<v.ObjectSchema<typeof getBucketAccountsResponse, undefined>>;

// ============================================================================
// PUT /buckets/:id/accounts - set accounts for a bucket
// ============================================================================
export const putBucketAccountsRequest = {
  id: v.string(),
  accountIds: v.array(v.string()),
};
export type PutBucketAccountsRequest = v.InferOutput<v.ObjectSchema<typeof putBucketAccountsRequest, undefined>>;
