import { api } from "@broccoliapps/shared";
import {
  batchDeleteTasksRequest,
  batchDeleteTasksResponse,
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
export const postTaskApi = api("POST", "/projects/:projectId/tasks").withRequest(postTaskRequest).withResponse(postTaskResponse);

// POST /projects/:projectId/tasks/:taskId/subtasks - create subtask
export const postSubtaskApi = api("POST", "/projects/:projectId/tasks/:taskId/subtasks").withRequest(postSubtaskRequest).withResponse(postSubtaskResponse);

// GET /projects/:projectId/tasks - list all tasks in project
export const getTasksApi = api("GET", "/projects/:projectId/tasks").withRequest(getTasksRequest).withResponse(getTasksResponse);

// GET /projects/:projectId/tasks/:id - get single task
export const getTaskApi = api("GET", "/projects/:projectId/tasks/:id").withRequest(getTaskRequest).withResponse(getTaskResponse);

// PATCH /projects/:projectId/tasks/:id - update task
export const patchTaskApi = api("PATCH", "/projects/:projectId/tasks/:id").withRequest(patchTaskRequest).withResponse(patchTaskResponse);

// DELETE /projects/:projectId/tasks/:id - delete task (cascades to subtasks)
export const deleteTaskApi = api("DELETE", "/projects/:projectId/tasks/:id").withRequest(deleteTaskRequest).withResponse(deleteTaskResponse);

// POST /projects/:projectId/tasks/batch-delete - batch delete tasks
export const batchDeleteTasksApi = api("POST", "/projects/:projectId/tasks/batch-delete")
  .withRequest(batchDeleteTasksRequest)
  .withResponse(batchDeleteTasksResponse);
