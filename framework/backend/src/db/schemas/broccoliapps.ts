import { table } from "../table";

export type AuthCode = {
  code: string;
  app: string;
  name: string;
  email: string;
  userId: string;
  provider: string;
  expiresAt: number;
  ttl: number;
};

export const authCodes = table<AuthCode>("authCode").key(["code"]).build();

export type MagicLinkToken = {
  token: string;
  email: string;
  app: string;
  createdAt: number;
  expiresAt: number;
  ttl: number;
};

export const magicLinkTokens = table<MagicLinkToken>("magicLinkToken").key(["token"]).build();
