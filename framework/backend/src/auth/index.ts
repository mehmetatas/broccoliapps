import { authToken } from "./token";

export type { AuthTokens } from "./token";
export type { UseAuthOptions } from "./handlers";

export const auth = {
  ...authToken,
};
