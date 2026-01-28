import { HttpError } from "@broccoliapps/backend";
import { random } from "@broccoliapps/shared";
import { tasks } from "../../db/tasks";
import {
  deleteTask,
  getTask,
  getTasks,
  patchTask,
  postTask,
} from "@broccoliapps/tasquito-shared";
import { api } from "../lambda";

// GET /tasks/:id - get single task
api.register(getTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const task = await tasks.get({ userId }, { id: req.id });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  return res.ok({ task });
});

// PATCH /tasks/:id - update task
api.register(patchTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const task = await tasks.get({ userId }, { id: req.id });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  const updatedTask = {
    ...task,
    ...(req.title !== undefined && { title: req.title }),
    ...(req.status !== undefined && { status: req.status }),
    updatedAt: Date.now(),
  };

  const updated = await tasks.put(updatedTask);

  return res.ok({ task: updated });
});

// DELETE /tasks/:id - delete task
api.register(deleteTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const task = await tasks.get({ userId }, { id: req.id });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  await tasks.delete({ userId }, { id: req.id });
  return res.noContent();
});

// POST /tasks - create task
api.register(postTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const taskId = random.id();
  const now = Date.now();

  const task = await tasks.put({
    userId,
    id: taskId,
    title: req.title,
    status: req.status ?? "todo",
    createdAt: now,
    updatedAt: now,
  });

  return res.ok({ task });
});

// GET /tasks - list all tasks
api.register(getTasks, async (_, res, ctx) => {
  const { userId } = await ctx.getUser();
  const result = await tasks.query({ userId }).all();
  return res.ok({ tasks: result });
});
