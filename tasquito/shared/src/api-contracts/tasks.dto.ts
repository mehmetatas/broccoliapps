import * as v from "valibot";
import { taskDto, taskStatusSchema } from "./dto";

// Shared schema for project counts returned by task mutations
const projectCountsSchema = v.optional(
  v.object({
    openTaskCount: v.number(),
    totalTaskCount: v.number(),
  })
);

// ============================================================================
// POST /projects/:projectId/tasks - create task
// ============================================================================
export const postTaskRequest = {
  projectId: v.string(),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  description: v.optional(v.pipe(v.string(), v.maxLength(200))),
  dueDate: v.optional(v.string()),
  status: v.optional(taskStatusSchema),
  subtasks: v.optional(v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(50)))),
};
export type PostTaskRequest = v.InferOutput<v.ObjectSchema<typeof postTaskRequest, undefined>>;

export const postTaskResponse = {
  task: v.object(taskDto),
  subtasks: v.optional(v.array(v.object(taskDto))),
  projectCounts: projectCountsSchema,
};
export type PostTaskResponse = v.InferOutput<v.ObjectSchema<typeof postTaskResponse, undefined>>;

// ============================================================================
// POST /projects/:projectId/tasks/:taskId/subtasks - create subtask
// ============================================================================
export const postSubtaskRequest = {
  projectId: v.string(),
  taskId: v.string(),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
};
export type PostSubtaskRequest = v.InferOutput<v.ObjectSchema<typeof postSubtaskRequest, undefined>>;

export const postSubtaskResponse = {
  task: v.object(taskDto),
};
export type PostSubtaskResponse = v.InferOutput<v.ObjectSchema<typeof postSubtaskResponse, undefined>>;

// ============================================================================
// GET /projects/:projectId/tasks - list all tasks in project
// ============================================================================
export const getTasksRequest = {
  projectId: v.string(),
};
export type GetTasksRequest = v.InferOutput<v.ObjectSchema<typeof getTasksRequest, undefined>>;

export const getTasksResponse = {
  tasks: v.array(v.object(taskDto)),
};
export type GetTasksResponse = v.InferOutput<v.ObjectSchema<typeof getTasksResponse, undefined>>;

// ============================================================================
// GET /projects/:projectId/tasks/:id - get single task
// ============================================================================
export const getTaskRequest = {
  projectId: v.string(),
  id: v.string(),
};
export type GetTaskRequest = v.InferOutput<v.ObjectSchema<typeof getTaskRequest, undefined>>;

export const getTaskResponse = {
  task: v.object(taskDto),
};
export type GetTaskResponse = v.InferOutput<v.ObjectSchema<typeof getTaskResponse, undefined>>;

// ============================================================================
// PATCH /projects/:projectId/tasks/:id - update task
// ============================================================================
export const patchTaskRequest = {
  projectId: v.string(),
  id: v.string(),
  title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(50))),
  description: v.optional(v.pipe(v.string(), v.maxLength(200))),
  dueDate: v.optional(v.nullable(v.string())), // null to clear
  status: v.optional(taskStatusSchema),
  sortOrder: v.optional(v.string()),
};
export type PatchTaskRequest = v.InferOutput<v.ObjectSchema<typeof patchTaskRequest, undefined>>;

export const patchTaskResponse = {
  task: v.object(taskDto),
  projectCounts: projectCountsSchema,
};
export type PatchTaskResponse = v.InferOutput<v.ObjectSchema<typeof patchTaskResponse, undefined>>;

// ============================================================================
// DELETE /projects/:projectId/tasks/:id - delete task (cascades to subtasks)
// ============================================================================
export const deleteTaskRequest = {
  projectId: v.string(),
  id: v.string(),
};
export type DeleteTaskRequest = v.InferOutput<v.ObjectSchema<typeof deleteTaskRequest, undefined>>;

export const deleteTaskResponse = {
  projectCounts: projectCountsSchema,
};
export type DeleteTaskResponse = v.InferOutput<v.ObjectSchema<typeof deleteTaskResponse, undefined>>;
