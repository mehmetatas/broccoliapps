import { table } from "../table";

export type Token = {
  hash: string;
  type: "refresh" | string;
  userId: string;
  createdAt: number;
  expiresAt: number;
  ttl: number;
};

export const tokens = table<Token>("token").key(["hash"]).gsi1("byUser", ["userId"], ["type", "createdAt"]).build();

export type User = {
  id: string;
  email: string;
  name: string;
  signInProvider: string;
  createdAt: number;
  updatedAt: number;
};

export const users = table<User>("user").key(["id"]).gsi1("byEmail", ["email"]).build();

export type UserPreference = {
  userId: string;
  key: string;
  value: string | number | boolean;
};

export const userPreferences = table<UserPreference>("userPreference")
  .key(["userId"], ["key"])
  .build();
