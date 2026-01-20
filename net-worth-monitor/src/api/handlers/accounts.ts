import { HttpError } from "@broccoliapps/backend";
import { random } from "@broccoliapps/shared";
import { accounts, historyItems } from "../../db/accounts";
import { buckets } from "../../db/buckets";
import {
  deleteAccount,
  getAccount,
  getAccountBuckets,
  getAccountHistory,
  getAccounts,
  patchAccount,
  postAccount,
  putAccountBuckets,
  putAccountHistory,
} from "../../shared/api-contracts";
import { api } from "../lambda";

// GET /accounts/:id/history - get history items (register most specific routes first)
api.register(getAccountHistory, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  const items = await historyItems.query({ userId, accountId: req.id }).all();
  return res.ok(items);
});

// PUT /accounts/:id/history - bulk update history items
api.register(putAccountHistory, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const account = await accounts.get({ userId }, { id: req.id });

  if (!account) {
    throw new HttpError(404, "Account not found");
  }

  // Get existing items to find which ones to delete
  const existingItems = await historyItems.query({ userId, accountId: req.id }).all();
  const newMonths = new Set(req.items.map((item) => item.month));

  // Delete items that are no longer in the list
  const itemsToDelete = existingItems.filter((item) => !newMonths.has(item.month));
  if (itemsToDelete.length > 0) {
    await historyItems.batchDelete(
      itemsToDelete.map((item) => ({
        pk: { userId, accountId: req.id },
        sk: { month: item.month },
      }))
    );
  }

  // Create/update history items
  const items = req.items.map((item) => ({
    userId,
    accountId: req.id,
    month: item.month,
    value: item.value,
  }));

  if (items.length > 0) {
    await historyItems.batchPut(items);
  }

  return res.ok(items);
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
    return res.ok([]);
  }

  // Fetch all buckets for the user and filter by bucketIds
  const allBuckets = await buckets.query({ userId }).all();
  const filteredBuckets = allBuckets.filter((bucket) => bucketIds.includes(bucket.id));

  return res.ok(filteredBuckets);
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

  // Update each added bucket's accountIds (add this account)
  for (const bucketId of addedBucketIds) {
    const bucket = await buckets.get({ userId }, { id: bucketId });
    if (bucket) {
      const accountIds = bucket.accountIds ?? [];
      if (!accountIds.includes(req.id)) {
        await buckets.put({
          ...bucket,
          accountIds: [...accountIds, req.id],
        });
      }
    }
  }

  // Update each removed bucket's accountIds (remove this account)
  for (const bucketId of removedBucketIds) {
    const bucket = await buckets.get({ userId }, { id: bucketId });
    if (bucket) {
      const accountIds = bucket.accountIds ?? [];
      await buckets.put({
        ...bucket,
        accountIds: accountIds.filter((id) => id !== req.id),
      });
    }
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

  return res.ok(account);
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

  if (req.closedAt !== undefined) {
    if (req.closedAt === null) {
      delete updatedAccount.closedAt;
    } else {
      updatedAccount.closedAt = req.closedAt;
    }
  }

  const updated = await accounts.put(updatedAccount);

  return res.ok(updated);
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
  for (const bucketId of bucketIds) {
    const bucket = await buckets.get({ userId }, { id: bucketId });
    if (bucket) {
      const accountIds = bucket.accountIds ?? [];
      await buckets.put({
        ...bucket,
        accountIds: accountIds.filter((id) => id !== req.id),
      });
    }
  }

  await accounts.delete({ userId }, { id: req.id });
  return res.noContent();
});

// POST /accounts - create account with history items
api.register(postAccount, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const accountId = random.id();

  const account = await accounts.put({
    userId,
    id: accountId,
    name: req.name,
    type: req.type,
    currency: req.currency,
    createdAt: Date.now(),
    ...(req.updateFrequency && { updateFrequency: req.updateFrequency }),
  });

  // Create history items
  const items = req.historyItems.map((item) => ({
    userId,
    accountId,
    month: item.month,
    value: item.value,
  }));
  await historyItems.batchPut(items);

  return res.ok(account);
});

// GET /accounts - list all accounts
api.register(getAccounts, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();
  const result = await accounts.query({ userId }).all();
  return res.ok(result);
});
