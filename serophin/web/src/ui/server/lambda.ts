import { PageRouter } from "@broccoliapps/backend";

export const page = new PageRouter();

import("./pages");

export const handler = page.lambdaHandler();
