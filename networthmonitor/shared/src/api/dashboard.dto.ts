import * as v from "valibot";
import { accountDto, bucketDto } from "./dto";

// ============================================================================
// GET /dashboard - get all accounts and buckets
// ============================================================================
export const getDashboardResponse = {
  accounts: v.array(v.object(accountDto)),
  buckets: v.array(v.object(bucketDto)),
};
export type GetDashboardResponse = v.InferOutput<v.ObjectSchema<typeof getDashboardResponse, undefined>>;
