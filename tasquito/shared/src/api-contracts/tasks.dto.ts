import * as v from "valibot";
import { idRequest, taskDto, taskStatusSchema } from "./dto";

// ============================================================================
// POST /tasks - create task
// ============================================================================
export const postTaskRequest = {
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  status: v.optional(taskStatusSchema),
};
export type PostTaskRequest = v.InferOutput<v.ObjectSchema<typeof postTaskRequest, undefined>>;

export const postTaskResponse = {
  task: v.object(taskDto),
};
export type PostTaskResponse = v.InferOutput<v.ObjectSchema<typeof postTaskResponse, undefined>>;

// ============================================================================
// GET /tasks - list all tasks
// ============================================================================
export const getTasksResponse = {
  tasks: v.array(v.object(taskDto)),
};
export type GetTasksResponse = v.InferOutput<v.ObjectSchema<typeof getTasksResponse, undefined>>;

// ============================================================================
// GET /tasks/:id - get single task
// ============================================================================
export const getTaskRequest = idRequest;
export type GetTaskRequest = v.InferOutput<v.ObjectSchema<typeof getTaskRequest, undefined>>;

export const getTaskResponse = {
  task: v.object(taskDto),
};
export type GetTaskResponse = v.InferOutput<v.ObjectSchema<typeof getTaskResponse, undefined>>;

// ============================================================================
// PATCH /tasks/:id - update task
// ============================================================================
export const patchTaskRequest = {
  id: v.string(),
  title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(200))),
  status: v.optional(taskStatusSchema),
};
export type PatchTaskRequest = v.InferOutput<v.ObjectSchema<typeof patchTaskRequest, undefined>>;

export const patchTaskResponse = {
  task: v.object(taskDto),
};
export type PatchTaskResponse = v.InferOutput<v.ObjectSchema<typeof patchTaskResponse, undefined>>;

// ============================================================================
// DELETE /tasks/:id - delete task
// ============================================================================
export const deleteTaskRequest = idRequest;
export type DeleteTaskRequest = v.InferOutput<v.ObjectSchema<typeof deleteTaskRequest, undefined>>;
