import { getDashboard } from "@broccoliapps/nwm-shared";
import { accounts, historyItems } from "../../db/accounts";
import { buckets } from "../../db/buckets";
import { api } from "../lambda";

// GET /dashboard - get all accounts, buckets, and histories in a single call
api.register(getDashboard, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();

  // Fetch accounts and buckets in parallel
  const [accountList, bucketList] = await Promise.all([accounts.query({ userId }).all(), buckets.query({ userId }).all()]);

  // Fetch history for all accounts in parallel
  const historyResults = await Promise.all(accountList.map((acc) => historyItems.query({ userId, accountId: acc.id }).all()));

  // Map accounts with embedded history
  const accountsWithHistory = accountList.map((acc, i) => {
    const items = historyResults[i] ?? [];
    const history: Record<string, number> = {};
    for (const item of items) {
      history[item.month] = item.value;
    }
    return { ...acc, history };
  });

  return res.ok({ accounts: accountsWithHistory, buckets: bucketList });
});
