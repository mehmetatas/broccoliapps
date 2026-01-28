import { HttpError } from "@broccoliapps/backend";
import { users } from "../../db/users";
import { getUser, patchUser } from "../../shared/api-contracts";
import { api } from "../lambda";

// GET /user - get current user profile
api.register(getUser, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();
  const user = await users.get({ id: userId });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return res.ok({ user });
});

// PATCH /user - update user profile
api.register(patchUser, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const user = await users.get({ id: userId });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  const updated = await users.put({
    ...user,
    targetCurrency: req.targetCurrency ?? user.targetCurrency,
    updatedAt: Date.now(),
  });

  return res.ok({ user: updated });
});
