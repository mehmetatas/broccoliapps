import { PageRouter } from "@broccoliapps/backend";

export const www = new PageRouter();

// Import page handlers - they self-register routes on page
import("./pages");

export const handler = www.lambdaHandler();
