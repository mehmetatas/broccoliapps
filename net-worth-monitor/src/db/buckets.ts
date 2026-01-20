import { table } from "@broccoliapps/backend/dist/db/table";

export type Bucket = {
  userId: string;
  id: string;
  name: string;
  createdAt: number;
  accountIds?: string[];
};

export const buckets = table<Bucket>("bucket")
  .key(["userId"], ["id"])
  .build();
