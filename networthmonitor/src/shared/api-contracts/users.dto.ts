import * as v from "valibot";
import { userDto } from "./dto";

// ============================================================================
// GET /user - get current user
// ============================================================================
export const getUserResponse = {
  user: v.object(userDto),
};
export type GetUserResponse = v.InferOutput<v.ObjectSchema<typeof getUserResponse, undefined>>;

// ============================================================================
// PATCH /user - update current user
// ============================================================================
export const patchUserRequest = {
  targetCurrency: v.optional(v.pipe(v.string(), v.length(3))),
};
export type PatchUserRequest = v.InferOutput<v.ObjectSchema<typeof patchUserRequest, undefined>>;

export const patchUserResponse = {
  user: v.object(userDto),
};
export type PatchUserResponse = v.InferOutput<v.ObjectSchema<typeof patchUserResponse, undefined>>;
