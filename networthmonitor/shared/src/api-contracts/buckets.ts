import { api } from "@broccoliapps/shared";
import {
  deleteBucketRequest,
  getBucketAccountsRequest,
  getBucketAccountsResponse,
  getBucketsResponse,
  patchBucketRequest,
  patchBucketResponse,
  postBucketRequest,
  postBucketResponse,
  putBucketAccountsRequest,
} from "./buckets.dto";

// GET /buckets - list all buckets
export const getBuckets = api("GET", "/buckets").withResponse(getBucketsResponse);

// POST /buckets - create bucket
export const postBucket = api("POST", "/buckets").withRequest(postBucketRequest).withResponse(postBucketResponse);

// PATCH /buckets/:id - update bucket
export const patchBucket = api("PATCH", "/buckets/:id").withRequest(patchBucketRequest).withResponse(patchBucketResponse);

// DELETE /buckets/:id - delete bucket
export const deleteBucket = api("DELETE", "/buckets/:id").withRequest(deleteBucketRequest);

// GET /buckets/:id/accounts - get accounts in a bucket
export const getBucketAccounts = api("GET", "/buckets/:id/accounts").withRequest(getBucketAccountsRequest).withResponse(getBucketAccountsResponse);

// PUT /buckets/:id/accounts - set accounts for a bucket
export const putBucketAccounts = api("PUT", "/buckets/:id/accounts").withRequest(putBucketAccountsRequest);
