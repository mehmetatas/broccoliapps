import { table } from "@broccoliapps/backend/dist/db/table";

export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  userId: string;
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
};

export const tasks = table<Task>("task").key(["userId"], ["id"]).build();
