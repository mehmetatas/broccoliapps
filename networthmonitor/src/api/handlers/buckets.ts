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
    return res.ok({ accounts: [] });
  }

  // Fetch all accounts for the user and filter by accountIds
  const allAccounts = await accounts.query({ userId }).all();
  const filteredAccounts = allAccounts.filter((account) => accountIds.includes(account.id));

  return res.ok({ accounts: filteredAccounts });
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

  // Batch fetch and update all affected accounts
  const allAffectedAccountIds = [...addedAccountIds, ...removedAccountIds];
  if (allAffectedAccountIds.length > 0) {
    const affectedAccounts = await accounts.batchGet(
      allAffectedAccountIds.map((id) => ({ pk: { userId }, sk: { id } }))
    );

    const updatedAccounts = affectedAccounts.map((account) => {
      const bucketIds = account.bucketIds ?? [];
      if (addedAccountIds.includes(account.id)) {
        // Add this bucket to the account
        if (!bucketIds.includes(req.id)) {
          return { ...account, bucketIds: [...bucketIds, req.id] };
        }
      } else {
        // Remove this bucket from the account
        return { ...account, bucketIds: bucketIds.filter((id) => id !== req.id) };
      }
      return account;
    });

    await accounts.batchPut(updatedAccounts);
  }

  return res.noContent();
});

// GET /buckets - list all buckets
api.register(getBuckets, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();
  const result = await buckets.query({ userId }).all();
  return res.ok({ buckets: result });
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

  return res.ok({ bucket });
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

  return res.ok({ bucket: updated });
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
  if (accountIds.length > 0) {
    const associatedAccounts = await accounts.batchGet(
      accountIds.map((id) => ({ pk: { userId }, sk: { id } }))
    );

    const updatedAccounts = associatedAccounts.map((account) => ({
      ...account,
      bucketIds: (account.bucketIds ?? []).filter((id) => id !== req.id),
    }));

    if (updatedAccounts.length > 0) {
      await accounts.batchPut(updatedAccounts);
    }
  }

  await buckets.delete({ userId }, { id: req.id });
  return res.noContent();
});
