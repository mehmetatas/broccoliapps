import { HttpError } from "@broccoliapps/backend";
import { random } from "@broccoliapps/shared";
import { generateKeyBetween } from "fractional-indexing";
import { projects } from "../../db/projects";
import { tasks, type Task } from "../../db/tasks";
import {
  deleteTask,
  getTask,
  getTasks,
  LIMITS,
  LIMIT_MESSAGES,
  patchTask,
  postSubtask,
  postTask,
} from "@broccoliapps/tasquito-shared";
import { api } from "../lambda";

// Ensure task has a sortOrder (for backward compatibility with existing data)
const ensureSortOrder = (task: Task): Task & { sortOrder: string } => ({
  ...task,
  sortOrder: task.sortOrder ?? generateKeyBetween(null, null),
});

// Helper to update project task counts
const updateProjectCounts = async (
  userId: string,
  projectId: string,
  deltaOpen: number,
  deltaTotal: number
): Promise<{ openTaskCount: number; totalTaskCount: number }> => {
  const project = await projects.get({ userId }, { id: projectId });
  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const openTaskCount = Math.max(0, (project.openTaskCount ?? 0) + deltaOpen);
  const totalTaskCount = Math.max(0, (project.totalTaskCount ?? 0) + deltaTotal);

  await projects.put({
    ...project,
    openTaskCount,
    totalTaskCount,
    updatedAt: Date.now(),
  });

  return { openTaskCount, totalTaskCount };
};

// POST /projects/:projectId/tasks - create task
api.register(postTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const taskId = random.id();
  const now = Date.now();
  const status = req.status ?? "todo";

  // Get existing tasks to determine sortOrder
  const existingTasks = await tasks.query({ userId, projectId: req.projectId }).all();

  // Check task limit (parent tasks only)
  const parentTaskCount = existingTasks.filter((t) => !t.parentId).length;
  if (parentTaskCount >= LIMITS.MAX_TASKS_PER_PROJECT) {
    throw new HttpError(403, LIMIT_MESSAGES.TASK);
  }

  // Check inline subtask count limit
  if (req.subtasks && req.subtasks.length > LIMITS.MAX_SUBTASKS_PER_TASK) {
    throw new HttpError(403, LIMIT_MESSAGES.SUBTASK);
  }

  const parentTasks = existingTasks.filter((t) => !t.parentId && t.status === status);
  const sortedTasks = parentTasks.sort((a, b) => {
    const aOrder = a.sortOrder ?? "";
    const bOrder = b.sortOrder ?? "";
    return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
  });
  const lastTask = sortedTasks.at(-1);
  const lastSortOrder = lastTask?.sortOrder ?? null;
  const sortOrder = generateKeyBetween(lastSortOrder, null);

  const task = await tasks.put({
    userId,
    projectId: req.projectId,
    id: taskId,
    title: req.title,
    description: req.description,
    dueDate: req.dueDate,
    status,
    sortOrder,
    createdAt: now,
    updatedAt: now,
  });

  // Create subtasks if provided
  const createdSubtasks = [];
  if (req.subtasks?.length) {
    let prevSubtaskOrder: string | null = null;
    for (const subtaskTitle of req.subtasks) {
      const subtaskSortOrder = generateKeyBetween(prevSubtaskOrder, null);
      const subtask = await tasks.put({
        userId,
        projectId: req.projectId,
        id: random.id(),
        parentId: taskId,
        title: subtaskTitle,
        status: "todo",
        sortOrder: subtaskSortOrder,
        createdAt: now,
        updatedAt: now,
      });
      createdSubtasks.push(subtask);
      prevSubtaskOrder = subtaskSortOrder;
    }

    // Update parent task with subtaskCount
    await tasks.put({
      ...task,
      subtaskCount: createdSubtasks.length,
      updatedAt: now,
    });
  }

  // Update project counts: +1 total, +1 open if status is "todo"
  const deltaOpen = status === "todo" ? 1 : 0;
  const projectCounts = await updateProjectCounts(userId, req.projectId, deltaOpen, 1);

  return res.ok({
    task: ensureSortOrder({ ...task, subtaskCount: createdSubtasks.length || undefined }),
    subtasks: createdSubtasks.length > 0 ? createdSubtasks.map(ensureSortOrder) : undefined,
    projectCounts,
  });
});

// POST /projects/:projectId/tasks/:taskId/subtasks - create subtask
api.register(postSubtask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();

  // Verify parent task exists
  const parentTask = await tasks.get({ userId, projectId: req.projectId }, { id: req.taskId });
  if (!parentTask) {
    throw new HttpError(404, "Parent task not found");
  }

  // Verify parent is not already a subtask (max 2 levels)
  if (parentTask.parentId) {
    throw new HttpError(400, "Cannot create subtask of a subtask");
  }

  // Get existing subtasks to determine sortOrder and check limit
  const allTasks = await tasks.query({ userId, projectId: req.projectId }).all();
  const existingSubtasks = allTasks.filter((t) => t.parentId === req.taskId);

  // Check subtask limit (use stored count if available, fall back to queried count)
  const currentSubtaskCount = parentTask.subtaskCount ?? existingSubtasks.length;
  if (currentSubtaskCount >= LIMITS.MAX_SUBTASKS_PER_TASK) {
    throw new HttpError(403, LIMIT_MESSAGES.SUBTASK);
  }

  const sortedSubtasks = existingSubtasks.sort((a, b) => {
    const aOrder = a.sortOrder ?? "";
    const bOrder = b.sortOrder ?? "";
    return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
  });
  const lastSubtask = sortedSubtasks.at(-1);
  const lastSubtaskSortOrder = lastSubtask?.sortOrder ?? null;
  const sortOrder = generateKeyBetween(lastSubtaskSortOrder, null);

  const subtaskId = random.id();
  const now = Date.now();

  const subtask = await tasks.put({
    userId,
    projectId: req.projectId,
    id: subtaskId,
    parentId: req.taskId,
    title: req.title,
    status: "todo",
    sortOrder,
    createdAt: now,
    updatedAt: now,
  });

  // Update parent's subtaskCount
  await tasks.put({
    ...parentTask,
    subtaskCount: currentSubtaskCount + 1,
    updatedAt: now,
  });

  return res.ok({ task: ensureSortOrder(subtask) });
});

// GET /projects/:projectId/tasks - list all tasks in project
api.register(getTasks, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const result = await tasks.query({ userId, projectId: req.projectId }).all();
  return res.ok({ tasks: result.map(ensureSortOrder) });
});

// GET /projects/:projectId/tasks/:id - get single task
api.register(getTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const task = await tasks.get({ userId, projectId: req.projectId }, { id: req.id });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  return res.ok({ task: ensureSortOrder(task) });
});

// PATCH /projects/:projectId/tasks/:id - update task
api.register(patchTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const task = await tasks.get({ userId, projectId: req.projectId }, { id: req.id });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  const updatedTask = {
    ...task,
    ...req.title !== undefined && { title: req.title },
    ...req.description !== undefined && { description: req.description },
    ...req.dueDate !== undefined && { dueDate: req.dueDate ?? undefined },
    ...req.status !== undefined && { status: req.status },
    ...req.sortOrder !== undefined && { sortOrder: req.sortOrder },
    updatedAt: Date.now(),
  };

  const updated = await tasks.put(updatedTask);

  // Update project counts if status changed on a parent task
  let projectCounts: { openTaskCount: number; totalTaskCount: number } | undefined;
  if (req.status !== undefined && req.status !== task.status && !task.parentId) {
    // Status changed: todo->done means -1 open, done->todo means +1 open
    const deltaOpen = req.status === "done" ? -1 : 1;
    projectCounts = await updateProjectCounts(userId, req.projectId, deltaOpen, 0);
  }

  return res.ok({ task: ensureSortOrder(updated), projectCounts });
});

// DELETE /projects/:projectId/tasks/:id - delete task (cascades to subtasks)
api.register(deleteTask, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const task = await tasks.get({ userId, projectId: req.projectId }, { id: req.id });

  if (!task) {
    throw new HttpError(404, "Task not found");
  }

  // If this is a parent task, delete all subtasks first
  if (!task.parentId) {
    const allTasks = await tasks.query({ userId, projectId: req.projectId }).all();
    const subtasks = allTasks.filter((t) => t.parentId === task.id);

    await Promise.all(
      subtasks.map((subtask) =>
        tasks.delete({ userId, projectId: req.projectId }, { id: subtask.id })
      )
    );
  }

  // Delete the task
  await tasks.delete({ userId, projectId: req.projectId }, { id: req.id });

  // Update project counts if this was a parent task
  let projectCounts: { openTaskCount: number; totalTaskCount: number } | undefined;
  if (!task.parentId) {
    const deltaOpen = task.status === "todo" ? -1 : 0;
    projectCounts = await updateProjectCounts(userId, req.projectId, deltaOpen, -1);
  } else {
    // This is a subtask - decrement parent's subtaskCount
    const parentTask = await tasks.get({ userId, projectId: req.projectId }, { id: task.parentId });
    if (parentTask) {
      await tasks.put({
        ...parentTask,
        subtaskCount: Math.max(0, (parentTask.subtaskCount ?? 0) - 1),
        updatedAt: Date.now(),
      });
    }
  }

  return res.ok({ projectCounts });
});
