import { api } from "@broccoliapps/shared";
import {
  deleteTaskRequest,
  deleteTaskResponse,
  getTaskRequest,
  getTaskResponse,
  getTasksRequest,
  getTasksResponse,
  patchTaskRequest,
  patchTaskResponse,
  postSubtaskRequest,
  postSubtaskResponse,
  postTaskRequest,
  postTaskResponse,
} from "./tasks.dto";

// POST /projects/:projectId/tasks - create task
export const postTask = api("POST", "/projects/:projectId/tasks").withRequest(postTaskRequest).withResponse(postTaskResponse);

// POST /projects/:projectId/tasks/:taskId/subtasks - create subtask
export const postSubtask = api("POST", "/projects/:projectId/tasks/:taskId/subtasks").withRequest(postSubtaskRequest).withResponse(postSubtaskResponse);

// GET /projects/:projectId/tasks - list all tasks in project
export const getTasks = api("GET", "/projects/:projectId/tasks").withRequest(getTasksRequest).withResponse(getTasksResponse);

// GET /projects/:projectId/tasks/:id - get single task
export const getTask = api("GET", "/projects/:projectId/tasks/:id").withRequest(getTaskRequest).withResponse(getTaskResponse);

// PATCH /projects/:projectId/tasks/:id - update task
export const patchTask = api("PATCH", "/projects/:projectId/tasks/:id").withRequest(patchTaskRequest).withResponse(patchTaskResponse);

// DELETE /projects/:projectId/tasks/:id - delete task (cascades to subtasks)
export const deleteTask = api("DELETE", "/projects/:projectId/tasks/:id").withRequest(deleteTaskRequest).withResponse(deleteTaskResponse);
