import { ApiRouter } from "@broccoliapps/backend";

export const api = new ApiRouter();

// Lazily import handlers - they self-register to api
import("./handlers");

export const handler = api.lambdaHandler();
