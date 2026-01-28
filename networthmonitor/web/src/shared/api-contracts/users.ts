import { api } from "@broccoliapps/shared";
import { getUserResponse, patchUserRequest, patchUserResponse } from "./users.dto";

// GET /user - get current user
export const getUser = api("GET", "/user")
  .withResponse(getUserResponse);

// PATCH /user - update current user
export const patchUser = api("PATCH", "/user")
  .withRequest(patchUserRequest)
  .withResponse(patchUserResponse);
