export * from "@broccoliapps/tasquito-shared/client";

import { cache } from "@broccoliapps/browser";

export const signOut = (): void => {
  cache.removeByPrefix("cache:");
  window.location.href = "/";
};
