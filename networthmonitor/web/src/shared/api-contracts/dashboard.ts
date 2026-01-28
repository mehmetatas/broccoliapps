import { api } from "@broccoliapps/shared";
import { getDashboardResponse } from "./dashboard.dto";

// GET /dashboard - get all accounts, buckets, and histories in a single call
export const getDashboard = api("GET", "/dashboard")
  .withResponse(getDashboardResponse);
