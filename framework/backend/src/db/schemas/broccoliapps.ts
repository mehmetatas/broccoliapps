import { table } from "../table";

export type AuthCode = {
  code: string;
  name: string;
  email: string;
  userId: string;
  provider: string;
  ttl: number;
};

export const authCodes = table<AuthCode>("authCode").key(["code"]).build();
