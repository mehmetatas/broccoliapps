import * as v from "valibot";

// ============================================================================
// GET /health - health check
// ============================================================================
export const getHealthResponse = {
  status: v.string(),
  timestamp: v.string(),
};
export type GetHealthResponse = v.InferOutput<v.ObjectSchema<typeof getHealthResponse, undefined>>;
