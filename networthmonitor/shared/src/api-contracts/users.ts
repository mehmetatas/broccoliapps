import { api } from "@broccoliapps/shared";
import { getUserResponse } from "./users.dto";

// GET /user - get current user
export const getUser = api("GET", "/user").withResponse(getUserResponse);
