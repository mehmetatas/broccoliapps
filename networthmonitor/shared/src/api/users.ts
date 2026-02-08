import { api } from "@broccoliapps/shared";
import { getUserResponse } from "./users.dto";

// GET /user - get current user
export const getUserApi = api("GET", "/user").withResponse(getUserResponse);
