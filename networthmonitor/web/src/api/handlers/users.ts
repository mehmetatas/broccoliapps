import { db, HttpError } from "@broccoliapps/backend";
import { getUserApi } from "@broccoliapps/nwm-shared";
import { api } from "../lambda";

// GET /user - get current user profile
api.register(getUserApi, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();
  const user = await db.shared.users.get({ id: userId });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return res.ok({ user });
});
