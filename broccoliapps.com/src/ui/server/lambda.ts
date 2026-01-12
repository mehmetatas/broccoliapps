import { PageRouter } from "@broccoliapps/framework-backend/http/page";

export const page = new PageRouter();

// Lazily import page handlers - they self-register to page
import("./pages");

export const handler = page.lambdaHandler();
