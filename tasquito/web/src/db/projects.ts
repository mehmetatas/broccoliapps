import { table } from "@broccoliapps/backend";

export type Project = {
  userId: string; // PK
  id: string; // SK
  name: string;
  isArchived?: boolean;
  archivedAt?: number;
  ttl?: number; // DynamoDB TTL for auto-deletion
  openTaskCount?: number;
  totalTaskCount?: number;
  createdAt: number;
  updatedAt: number;
};

export const projects = table<Project>("project").key(["userId"], ["id"]).build();
