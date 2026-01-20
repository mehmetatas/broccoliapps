import { table } from "@broccoliapps/backend/dist/db/table";

export type UpdateFrequency = "monthly" | "quarterly" | "biannually" | "yearly";

export type Account = {
  userId: string;
  id: string;
  name: string;
  type: "asset" | "debt";
  currency: string;
  createdAt: number;
  closedAt?: number;
  bucketIds?: string[];
  updateFrequency?: UpdateFrequency;
};


export type HistoryItem = {
  userId: string;
  accountId: string;
  month: string;
  value: number;
};

export const accounts = table<Account>("account").key(["userId"], ["id"]).build();

export const historyItems = table<HistoryItem>("historyItem").key(["userId", "accountId"], ["month"]).build();