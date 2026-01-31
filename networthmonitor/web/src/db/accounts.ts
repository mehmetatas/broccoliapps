import { table } from "@broccoliapps/backend";

export type UpdateFrequency = "monthly" | "quarterly" | "biannually" | "yearly";

export type Account = {
  userId: string;
  id: string;
  name: string;
  type: "asset" | "debt";
  currency: string;
  updateFrequency: UpdateFrequency;
  nextUpdate: string; // yyyy-mm set upon account creation and every historyItem update based on update frequency.
  createdAt: number;
  archivedAt?: number;
  bucketIds?: string[];
};


export type HistoryItem = {
  userId: string;
  accountId: string;
  month: string;
  value: number;
};

export const accounts = table<Account>("account").key(["userId"], ["id"]).gsi1("byNextUpdate", [], ["nextUpdate"]).build();

export const historyItems = table<HistoryItem>("historyItem").key(["userId", "accountId"], ["month"]).build();