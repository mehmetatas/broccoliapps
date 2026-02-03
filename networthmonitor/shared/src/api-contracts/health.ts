import { api } from "@broccoliapps/shared";
import { getHealthResponse } from "./health.dto";

// GET /health - health check
export const getHealth = api("GET", "/health").withResponse(getHealthResponse);
