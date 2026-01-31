import { getUserPreferences, setUserPreference } from "@broccoliapps/shared";
import { userPreferences } from "./db/schemas/shared";
import type { ApiRouter } from "./http/api-router";

export const registerPreferenceHandlers = (api: ApiRouter) => {
  api.register(getUserPreferences, async (_, res, ctx) => {
    const { userId } = await ctx.getUser();
    const items = await userPreferences.query({ userId }).all();

    const preferences: Record<string, string | number | boolean> = {};
    for (const item of items) {
      preferences[item.key] = item.value;
    }

    return res.ok({ preferences });
  });

  api.register(setUserPreference, async (req, res, ctx) => {
    const { userId } = await ctx.getUser();

    await userPreferences.put({ userId, key: req.key, value: req.value });

    return res.ok({ key: req.key, value: req.value });
  });
};
