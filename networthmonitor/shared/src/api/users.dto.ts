import * as v from "valibot";
import { userDto } from "./dto";

// ============================================================================
// GET /user - get current user
// ============================================================================
export const getUserResponse = {
  user: v.object(userDto),
};
export type GetUserResponse = v.InferOutput<v.ObjectSchema<typeof getUserResponse, undefined>>;
