import { api } from "@broccoliapps/shared";
import { getHealthResponse } from "./health.dto";

// GET /health - health check
export const getHealthApi = api("GET", "/health").withResponse(getHealthResponse);
