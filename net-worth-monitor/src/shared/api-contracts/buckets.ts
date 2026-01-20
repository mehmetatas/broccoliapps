import { api } from "@broccoliapps/shared";
import * as v from "valibot";
import type { Bucket } from "../../db/buckets";
import type { Account } from "../../db/accounts";

// GET /buckets - list all buckets
export const getBuckets = api("GET", "/buckets").withResponse<Bucket[]>();

// POST /buckets - create bucket
export const postBucket = api("POST", "/buckets")
  .withRequest({
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  })
  .withResponse<Bucket>();

// PATCH /buckets/:id - update bucket
export const patchBucket = api("PATCH", "/buckets/:id")
  .withRequest({
    id: v.string(),
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  })
  .withResponse<Bucket>();

// DELETE /buckets/:id - delete bucket
export const deleteBucket = api("DELETE", "/buckets/:id").withRequest({
  id: v.string(),
});

// GET /buckets/:id/accounts - get accounts in a bucket
export const getBucketAccounts = api("GET", "/buckets/:id/accounts")
  .withRequest({
    id: v.string(),
  })
  .withResponse<Account[]>();

// PUT /buckets/:id/accounts - set accounts for a bucket
export const putBucketAccounts = api("PUT", "/buckets/:id/accounts")
  .withRequest({
    id: v.string(),
    accountIds: v.array(v.string()),
  });
