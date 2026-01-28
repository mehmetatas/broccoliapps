import { api } from "@broccoliapps/shared";
import {
  deleteTaskRequest,
  getTaskRequest,
  getTaskResponse,
  getTasksResponse,
  patchTaskRequest,
  patchTaskResponse,
  postTaskRequest,
  postTaskResponse,
} from "./tasks.dto";

// POST /tasks - create task
export const postTask = api("POST", "/tasks")
  .withRequest(postTaskRequest)
  .withResponse(postTaskResponse);

// GET /tasks - list all tasks
export const getTasks = api("GET", "/tasks")
  .withResponse(getTasksResponse);

// GET /tasks/:id - get single task
export const getTask = api("GET", "/tasks/:id")
  .withRequest(getTaskRequest)
  .withResponse(getTaskResponse);

// PATCH /tasks/:id - update task
export const patchTask = api("PATCH", "/tasks/:id")
  .withRequest(patchTaskRequest)
  .withResponse(patchTaskResponse);

// DELETE /tasks/:id - delete task
export const deleteTask = api("DELETE", "/tasks/:id")
  .withRequest(deleteTaskRequest);
