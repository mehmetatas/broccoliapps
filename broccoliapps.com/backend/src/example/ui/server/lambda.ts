import { PageRouter } from "../../../framework/backend/http/page";

export const page = new PageRouter();

// Lazily import handlers - they self-register to page
import("./pages/handlers");

export const handler = page.lambdaHandler();
