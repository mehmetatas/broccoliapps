import { table } from "@broccoliapps/backend";

export type TaskStatus = "todo" | "done";

export type Task = {
  projectId: string; // PK - enables querying all tasks in a project
  id: string; // SK
  userId: string; // For authorization
  parentId?: string; // If set, this is a subtask
  title: string;
  description?: string; // Only for parent tasks
  dueDate?: string; // YYYY-MM-DD format, only for parent tasks
  status: TaskStatus;
  sortOrder?: string; // Fractional index for ordering (optional for backward compatibility)
  subtaskCount?: number; // Only for parent tasks - tracks number of subtasks
  ttl?: number; // DynamoDB TTL for auto-deletion
  createdAt: number;
  updatedAt: number;
};

export const tasks = table<Task>("task")
  .key(["userId", "projectId"], ["id"])
  .gsi1("byParent", ["userId", "projectId"], ["parentId"]) // To query subtasks of a task
  .build();
