import { authToken } from "./token";

export type { UseAuthOptions } from "./handlers";
export type { AuthTokens } from "./token";

export const auth = {
  ...authToken,
};
