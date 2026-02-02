import { HttpError } from "@broccoliapps/backend";
import { random } from "@broccoliapps/shared";
import { accounts, historyItems } from "../../db/accounts";
import { calculateNextUpdate } from "../utils/nextUpdateCalculator";
import { buckets } from "../../db/buckets";
import {
  deleteAccount,
  deleteHistoryItem,
  getAccount,
  getAccountBuckets,
  getAccountDetail,
  getAccountHistory,
  getAccounts,
  patchAccount,
  postAccount,
  postHistoryItem,
  putAccountBuckets,
} from "@broccoliapps/nwm-shared";
import { api } from "../lambda";

// GET /accounts/:id/detail - get account with all related data (register most specific routes first)
api.register(getAccountDetail, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  // Fetch history items and all buckets in parallel
  const [items, allBuckets] = await Promise.all([
    historyItems.query({ userId, accountId: req.id }).all(),
    buckets.query({ userId }).all(),
  ]);

  // Convert history items to Record<string, number> map
  const history: Record<string, number> = {};
  for (const item of items) {
    history[item.month] = item.value;
  }

  // Filter allBuckets to get accountBuckets
  const bucketIds = account.bucketIds ?? [];
  const accountBuckets = allBuckets.filter((bucket) => bucketIds.includes(bucket.id));

  return res.ok({
    account: { ...account, history },
    accountBuckets,
    allBuckets,
  });
});

// GET /accounts/:id/history - get history items (register most specific routes first)
api.register(getAccountHistory, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  const items = await historyItems.query({ userId, accountId: req.id }).all();

  // Convert to Record<string, number>
  const history: Record<string, number> = {};
  for (const item of items) {
    history[item.month] = item.value;
  }

  return res.ok({ history });
});

// POST /accounts/:id/history-item - add/update a single history item
api.register(postHistoryItem, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  // Upsert the single history item
  await historyItems.put({
    userId,
    accountId: req.id,
    month: req.month,
    value: req.value,
  });

  // Fetch all history items to recalculate nextUpdate
  const allItems = await historyItems.query({ userId, accountId: req.id }).all();
  const history: Record<string, number> = {};
  for (const item of allItems) {
    history[item.month] = item.value;
  }

  // Recalculate and update nextUpdate
  const nextUpdate = calculateNextUpdate(history, account.updateFrequency);
  await accounts.put({ ...account, nextUpdate });

  return res.ok({ month: req.month, value: req.value, nextUpdate });
});

// DELETE /accounts/:id/history-item/:month - delete a single history item
api.register(deleteHistoryItem, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  // Delete the single history item by month
  await historyItems.delete({ userId, accountId: req.id }, { month: req.month });

  // Fetch remaining history items to recalculate nextUpdate
  const remainingItems = await historyItems.query({ userId, accountId: req.id }).all();
  const history: Record<string, number> = {};
  for (const item of remainingItems) {
    history[item.month] = item.value;
  }

  // Recalculate and update nextUpdate
  const nextUpdate = calculateNextUpdate(history, account.updateFrequency);
  await accounts.put({ ...account, nextUpdate });

  return res.ok({ success: true, nextUpdate });
});

// GET /accounts/:id/buckets - get buckets for an account
api.register(getAccountBuckets, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  const bucketIds = account.bucketIds ?? [];

  if (bucketIds.length === 0) {
    return res.ok({ buckets: [] });
  }

  // Fetch all buckets for the user and filter by bucketIds
  const allBuckets = await buckets.query({ userId }).all();
  const filteredBuckets = allBuckets.filter((bucket) => bucketIds.includes(bucket.id));

  return res.ok({ buckets: filteredBuckets });
});

// PUT /accounts/:id/buckets - set buckets for an account
api.register(putAccountBuckets, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  const existingBucketIds = new Set(account.bucketIds ?? []);
  const newBucketIds = new Set(req.bucketIds);

  // Calculate which buckets were added and removed
  const addedBucketIds = req.bucketIds.filter((id) => !existingBucketIds.has(id));
  const removedBucketIds = [...existingBucketIds].filter((id) => !newBucketIds.has(id));

  // Update the account's bucketIds
  await accounts.put({
    ...account,
    bucketIds: req.bucketIds,
  });

  // Batch fetch and update all affected buckets
  const allAffectedBucketIds = [...addedBucketIds, ...removedBucketIds];
  if (allAffectedBucketIds.length > 0) {
    const affectedBuckets = await buckets.batchGet(
      allAffectedBucketIds.map((id) => ({ pk: { userId }, sk: { id } }))
    );

    const updatedBuckets = affectedBuckets.map((bucket) => {
      const accountIds = bucket.accountIds ?? [];
      if (addedBucketIds.includes(bucket.id)) {
        // Add this account to the bucket
        if (!accountIds.includes(req.id)) {
          return { ...bucket, accountIds: [...accountIds, req.id] };
        }
      } else {
        // Remove this account from the bucket
        return { ...bucket, accountIds: accountIds.filter((id) => id !== req.id) };
      }
      return bucket;
    });

    await buckets.batchPut(updatedBuckets);
  }

  return res.noContent();
});

// GET /accounts/:id - get single account
api.register(getAccount, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  return res.ok({ account });
});

// PATCH /accounts/:id - update account
api.register(patchAccount, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  const updatedAccount = { ...account };

  if (req.name !== undefined) {
    updatedAccount.name = req.name;
  }

  if (req.archivedAt !== undefined) {
    if (req.archivedAt === null) {
      delete updatedAccount.archivedAt;
    } else {
      updatedAccount.archivedAt = req.archivedAt;
    }
  }

  const updated = await accounts.put(updatedAccount);

  return res.ok({ account: updated });
});

// DELETE /accounts/:id - delete account and all history
api.register(deleteAccount, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  // Delete all history items for this account
  const items = await historyItems.query({ userId, accountId: req.id }).all();
  if (items.length > 0) {
    await historyItems.batchDelete(
      items.map((item) => ({
        pk: { userId, accountId: req.id },
        sk: { month: item.month },
      }))
    );
  }

  // Remove this account ID from all associated buckets' accountIds
  const bucketIds = account.bucketIds ?? [];
  if (bucketIds.length > 0) {
    const associatedBuckets = await buckets.batchGet(
      bucketIds.map((id) => ({ pk: { userId }, sk: { id } }))
    );

    const updatedBuckets = associatedBuckets.map((bucket) => ({
      ...bucket,
      accountIds: (bucket.accountIds ?? []).filter((id) => id !== req.id),
    }));

    if (updatedBuckets.length > 0) {
      await buckets.batchPut(updatedBuckets);
    }
  }

  await accounts.delete({ userId }, { id: req.id });
  return res.noContent();
});

// POST /accounts - create account with history items
api.register(postAccount, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const accountId = random.id();
  const nextUpdate = calculateNextUpdate(req.history, req.updateFrequency);

  const account = await accounts.put({
    userId,
    id: accountId,
    name: req.name,
    type: req.type,
    currency: req.currency,
    createdAt: Date.now(),
    nextUpdate,
    ...req.updateFrequency && { updateFrequency: req.updateFrequency },
  });

  // Create history items from Record
  const items = Object.entries(req.history).map(([month, value]) => ({
    userId,
    accountId,
    month,
    value,
  }));
  await historyItems.batchPut(items);

  return res.ok({ account });
});

// GET /accounts - list all accounts
api.register(getAccounts, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();
  const result = await accounts.query({ userId }).all();
  return res.ok({ accounts: result });
});
