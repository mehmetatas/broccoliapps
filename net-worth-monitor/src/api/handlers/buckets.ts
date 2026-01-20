import { HttpError } from "@broccoliapps/backend";
import { random } from "@broccoliapps/shared";
import { accounts } from "../../db/accounts";
import { buckets } from "../../db/buckets";
import {
  deleteBucket,
  getBucketAccounts,
  getBuckets,
  patchBucket,
  postBucket,
  putBucketAccounts,
} from "../../shared/api-contracts";
import { api } from "../lambda";

// GET /buckets/:id/accounts - get accounts in a bucket (register most specific routes first)
api.register(getBucketAccounts, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const bucket = await buckets.get({ userId }, { id: req.id });

  if (!bucket) {
    throw new HttpError(404, "Bucket not found");
  }

  const accountIds = bucket.accountIds ?? [];

  if (accountIds.length === 0) {
    return res.ok([]);
  }

  // Fetch all accounts for the user and filter by accountIds
  const allAccounts = await accounts.query({ userId }).all();
  const filteredAccounts = allAccounts.filter((account) => accountIds.includes(account.id));

  return res.ok(filteredAccounts);
});

// PUT /buckets/:id/accounts - set accounts for a bucket
api.register(putBucketAccounts, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const bucket = await buckets.get({ userId }, { id: req.id });

  if (!bucket) {
    throw new HttpError(404, "Bucket not found");
  }

  const existingAccountIds = new Set(bucket.accountIds ?? []);
  const newAccountIds = new Set(req.accountIds);

  // Calculate which accounts were added and removed
  const addedAccountIds = req.accountIds.filter((id) => !existingAccountIds.has(id));
  const removedAccountIds = [...existingAccountIds].filter((id) => !newAccountIds.has(id));

  // Update the bucket's accountIds
  await buckets.put({
    ...bucket,
    accountIds: req.accountIds,
  });

  // Update each added account's bucketIds (add this bucket)
  for (const accountId of addedAccountIds) {
    const account = await accounts.get({ userId }, { id: accountId });
    if (account) {
      const bucketIds = account.bucketIds ?? [];
      if (!bucketIds.includes(req.id)) {
        await accounts.put({
          ...account,
          bucketIds: [...bucketIds, req.id],
        });
      }
    }
  }

  // Update each removed account's bucketIds (remove this bucket)
  for (const accountId of removedAccountIds) {
    const account = await accounts.get({ userId }, { id: accountId });
    if (account) {
      const bucketIds = account.bucketIds ?? [];
      await accounts.put({
        ...account,
        bucketIds: bucketIds.filter((id) => id !== req.id),
      });
    }
  }

  return res.noContent();
});

// GET /buckets - list all buckets
api.register(getBuckets, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();
  const result = await buckets.query({ userId }).all();
  return res.ok(result);
});

// POST /buckets - create bucket
api.register(postBucket, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const bucketId = random.id();

  const bucket = await buckets.put({
    userId,
    id: bucketId,
    name: req.name,
    createdAt: Date.now(),
  });

  return res.ok(bucket);
});

// PATCH /buckets/:id - update bucket
api.register(patchBucket, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const bucket = await buckets.get({ userId }, { id: req.id });

  if (!bucket) {
    throw new HttpError(404, "Bucket not found");
  }

  const updated = await buckets.put({
    ...bucket,
    name: req.name,
  });

  return res.ok(updated);
});

// DELETE /buckets/:id - delete bucket and update all associated accounts
api.register(deleteBucket, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const bucket = await buckets.get({ userId }, { id: req.id });

  if (!bucket) {
    throw new HttpError(404, "Bucket not found");
  }

  // Remove this bucket ID from all associated accounts' bucketIds
  const accountIds = bucket.accountIds ?? [];
  for (const accountId of accountIds) {
    const account = await accounts.get({ userId }, { id: accountId });
    if (account) {
      const bucketIds = account.bucketIds ?? [];
      await accounts.put({
        ...account,
        bucketIds: bucketIds.filter((id) => id !== req.id),
      });
    }
  }

  await buckets.delete({ userId }, { id: req.id });
  return res.noContent();
});
