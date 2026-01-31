import {
  deleteTask as deleteTaskApi,
  getTask as getTaskApi,
  getTasks as getTasksApi,
  patchTask as patchTaskApi,
  postSubtask as postSubtaskApi,
  postTask as postTaskApi,
  type TaskDto,
} from "../api-contracts";
import { CACHE_KEYS, getCacheExpiry } from "./cache";
import { getCache } from "./init";
import { setProjectCountsInCache } from "./projects";

type Task = TaskDto;

// Helper functions for cache management
const getAllTasksFromCache = (projectId: string): Task[] => {
  const keys = getCache().keys(CACHE_KEYS.taskPrefix(projectId));
  const tasks: Task[] = [];
  for (const key of keys) {
    const task = getCache().get<Task>(key);
    if (task) tasks.push(task);
  }
  return tasks;
};

const setTaskInCache = (task: Task) => {
  getCache().set(CACHE_KEYS.task(task.projectId, task.id), task, getCacheExpiry());
};

const setAllTasksInCache = (tasks: Task[]) => {
  for (const task of tasks) {
    setTaskInCache(task);
  }
};

const removeTaskFromCache = (projectId: string, id: string) => {
  getCache().remove(CACHE_KEYS.task(projectId, id));
};

// GET /projects/:projectId/tasks - list all tasks in project with cache
export const getTasks = async (projectId: string): Promise<{ tasks: Task[] }> => {
  const tasksFetched = getCache().get<boolean>(CACHE_KEYS.tasksFetched(projectId));
  if (tasksFetched) {
    const tasks = getAllTasksFromCache(projectId);
    if (tasks.length > 0) return { tasks };
  }

  const data = await getTasksApi.invoke({ projectId });
  setAllTasksInCache(data.tasks);
  getCache().set(CACHE_KEYS.tasksFetched(projectId), true, getCacheExpiry());
  return data;
};

// GET /projects/:projectId/tasks/:id - get single task with cache
export const getTask = async (projectId: string, id: string): Promise<{ task: Task }> => {
  const cachedTask = getCache().get<Task>(CACHE_KEYS.task(projectId, id));
  if (cachedTask) {
    return { task: cachedTask };
  }

  const data = await getTaskApi.invoke({ projectId, id });
  setTaskInCache(data.task);
  return data;
};

// POST /projects/:projectId/tasks - create task with cache update
export const postTask = async (data: {
  projectId: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: "todo" | "done";
  subtasks?: string[];
}): Promise<{ task: Task; subtasks?: Task[] }> => {
  const result = await postTaskApi.invoke(data);
  setTaskInCache(result.task);
  if (result.subtasks) {
    setAllTasksInCache(result.subtasks);
  }
  if (result.projectCounts) {
    setProjectCountsInCache(data.projectId, result.projectCounts.openTaskCount, result.projectCounts.totalTaskCount);
  }
  return result;
};

// POST /projects/:projectId/tasks/:taskId/subtasks - create subtask with cache update
export const postSubtask = async (
  projectId: string,
  taskId: string,
  title: string
): Promise<{ task: Task }> => {
  const result = await postSubtaskApi.invoke({ projectId, taskId, title });
  setTaskInCache(result.task);
  return result;
};

// PATCH /projects/:projectId/tasks/:id - update task with cache update
export const patchTask = async (
  ...args: Parameters<typeof patchTaskApi.invoke>
): Promise<{ task: Task }> => {
  const result = await patchTaskApi.invoke(...args);
  setTaskInCache(result.task);
  if (result.projectCounts) {
    setProjectCountsInCache(result.task.projectId, result.projectCounts.openTaskCount, result.projectCounts.totalTaskCount);
  }
  return result;
};

// DELETE /projects/:projectId/tasks/:id - delete task with cache update
export const deleteTask = async (projectId: string, id: string): Promise<void> => {
  const result = await deleteTaskApi.invoke({ projectId, id });
  removeTaskFromCache(projectId, id);
  if (result.projectCounts) {
    setProjectCountsInCache(projectId, result.projectCounts.openTaskCount, result.projectCounts.totalTaskCount);
  }
};
