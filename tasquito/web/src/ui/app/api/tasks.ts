import { cache } from "@broccoliapps/browser";
import {
  deleteTask as deleteTaskApi,
  getTask as getTaskApi,
  getTasks as getTasksApi,
  patchTask as patchTaskApi,
  postTask as postTaskApi,
  type TaskDto,
} from "@broccoliapps/tasquito-shared";
import { CACHE_KEYS, sessionStorage } from "./cache";

type Task = TaskDto;

// Helper functions for cache management
const getAllTasksFromCache = (): Task[] => {
  const keys = cache.keys(CACHE_KEYS.taskPrefix, sessionStorage);
  const tasks: Task[] = [];
  for (const key of keys) {
    const task = cache.get<Task>(key, sessionStorage);
    if (task) tasks.push(task);
  }
  return tasks;
};

const setTaskInCache = (task: Task) => {
  cache.set(CACHE_KEYS.task(task.id), task, undefined, sessionStorage);
};

const setAllTasksInCache = (tasks: Task[]) => {
  for (const task of tasks) {
    setTaskInCache(task);
  }
};

const removeTaskFromCache = (id: string) => {
  cache.remove(CACHE_KEYS.task(id), sessionStorage);
};

// GET /tasks - list all tasks with cache
export const getTasks = async (): Promise<{ tasks: Task[] }> => {
  const tasksFetched = cache.get<boolean>(CACHE_KEYS.tasksFetched, sessionStorage);
  if (tasksFetched) {
    const tasks = getAllTasksFromCache();
    if (tasks.length > 0) return { tasks };
  }

  const data = await getTasksApi.invoke({});
  setAllTasksInCache(data.tasks);
  cache.set(CACHE_KEYS.tasksFetched, true, undefined, sessionStorage);
  return data;
};

// GET /tasks/:id - get single task with cache
export const getTask = async (id: string): Promise<{ task: Task }> => {
  const cachedTask = cache.get<Task>(CACHE_KEYS.task(id), sessionStorage);
  if (cachedTask) {
    return { task: cachedTask };
  }

  const data = await getTaskApi.invoke({ id });
  setTaskInCache(data.task);
  return data;
};

// POST /tasks - create task with cache update
export const postTask = async (
  ...args: Parameters<typeof postTaskApi.invoke>
): Promise<{ task: Task }> => {
  const result = await postTaskApi.invoke(...args);
  setTaskInCache(result.task);
  return result;
};

// PATCH /tasks/:id - update task with cache update
export const patchTask = async (
  ...args: Parameters<typeof patchTaskApi.invoke>
): Promise<{ task: Task }> => {
  const result = await patchTaskApi.invoke(...args);
  setTaskInCache(result.task);
  return result;
};

// DELETE /tasks/:id - delete task with cache update
export const deleteTask = async (id: string): Promise<void> => {
  await deleteTaskApi.invoke({ id });
  removeTaskFromCache(id);
};

// Invalidate all tasks cache
export const invalidateTasksCache = () => {
  cache.removeByPrefix(CACHE_KEYS.taskPrefix, sessionStorage);
  cache.remove(CACHE_KEYS.tasksFetched, sessionStorage);
};
