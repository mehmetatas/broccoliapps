// TODO: this needs to move to broccoliapps. we put it here thinking all repos will be used by an admin project but better we achive that with symlinks.
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
  platform?: string;
  createdAt: number;
  expiresAt: number;
  ttl: number;
};

export const magicLinkTokens = table<MagicLinkToken>("magicLinkToken").key(["token"]).build();

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  updatedAt: number;
};

export const users = table<User>("user").key(["id"]).gsi1("byEmail", ["email"]).build();
