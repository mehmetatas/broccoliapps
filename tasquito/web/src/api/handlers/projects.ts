import { HttpError, ttl } from "@broccoliapps/backend";
import { random } from "@broccoliapps/shared";
import {
  archiveProject,
  deleteProject,
  getProject,
  getProjects,
  LIMIT_MESSAGES,
  LIMITS,
  patchProject,
  postProject,
  unarchiveProject,
} from "@broccoliapps/tasquito-shared";
import { generateKeyBetween } from "fractional-indexing";
import { projects } from "../../db/projects";
import { type Task, tasks } from "../../db/tasks";
import { api } from "../lambda";

// Ensure task has a sortOrder (for backward compatibility with existing data)
const ensureSortOrder = (task: Task): Task & { sortOrder: string } => ({
  ...task,
  sortOrder: task.sortOrder ?? generateKeyBetween(null, null),
});

// POST /projects - create project
api.register(postProject, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();

  // Check active project limit
  const userProjects = await projects.query({ userId }).all();
  const activeCount = userProjects.filter((p) => !p.isArchived).length;
  if (activeCount >= LIMITS.MAX_ACTIVE_PROJECTS) {
    throw new HttpError(403, LIMIT_MESSAGES.PROJECT);
  }

  const projectId = random.id();
  const now = Date.now();

  const project = await projects.put({
    userId,
    id: projectId,
    name: req.name,
    openTaskCount: 0,
    totalTaskCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return res.ok({ project });
});

// GET /projects - list all projects with open task counts
api.register(getProjects, async (_req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const projectList = await projects.query({ userId }).all();

  // Return stored counts (default to 0 if missing for backward compatibility)
  const projectSummaries = projectList.map((project) => ({
    id: project.id,
    name: project.name,
    isArchived: project.isArchived,
    archivedAt: project.archivedAt,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    openTaskCount: project.openTaskCount ?? 0,
    totalTaskCount: project.totalTaskCount ?? 0,
  }));

  return res.ok({ projects: projectSummaries });
});

// GET /projects/:id - get single project with tasks
api.register(getProject, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const project = await projects.get({ userId }, { id: req.id });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  // Get all tasks for this project
  const allTasks = await tasks.query({ userId, projectId: project.id }).all();

  // Separate parent tasks and subtasks
  const parentTasks = allTasks.filter((t) => !t.parentId);
  const subtasksMap = new Map<string, Task[]>();

  for (const task of allTasks) {
    if (task.parentId) {
      const existing = subtasksMap.get(task.parentId) || [];
      existing.push(task);
      subtasksMap.set(task.parentId, existing);
    }
  }

  // Build tasks with nested subtasks
  const tasksWithSubtasks = parentTasks.map((task) => {
    const taskSubtasks = subtasksMap.get(task.id) || [];
    // Sort subtasks by sortOrder
    const sortedSubtasks = [...taskSubtasks].sort((a, b) => {
      const aOrder = a.sortOrder ?? "";
      const bOrder = b.sortOrder ?? "";
      return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
    });
    const taskWithSortOrder = ensureSortOrder(task);
    return {
      id: taskWithSortOrder.id,
      projectId: taskWithSortOrder.projectId,
      parentId: taskWithSortOrder.parentId,
      title: taskWithSortOrder.title,
      note: taskWithSortOrder.note,
      dueDate: taskWithSortOrder.dueDate,
      status: taskWithSortOrder.status,
      sortOrder: taskWithSortOrder.sortOrder,
      createdAt: taskWithSortOrder.createdAt,
      updatedAt: taskWithSortOrder.updatedAt,
      subtasks: sortedSubtasks.map((st) => {
        const stWithSortOrder = ensureSortOrder(st);
        return {
          id: stWithSortOrder.id,
          projectId: stWithSortOrder.projectId,
          parentId: stWithSortOrder.parentId,
          title: stWithSortOrder.title,
          note: stWithSortOrder.note,
          dueDate: stWithSortOrder.dueDate,
          status: stWithSortOrder.status,
          sortOrder: stWithSortOrder.sortOrder,
          createdAt: stWithSortOrder.createdAt,
          updatedAt: stWithSortOrder.updatedAt,
        };
      }),
    };
  });

  // Sort tasks by status (todo first), then by sortOrder
  // Note: Use standard string comparison (<, >) for sortOrder, not localeCompare,
  // because fractional-indexing generates keys designed for ASCII comparison
  tasksWithSubtasks.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "todo" ? -1 : 1;
    }
    const aOrder = a.sortOrder ?? "";
    const bOrder = b.sortOrder ?? "";
    return aOrder < bOrder ? -1 : aOrder > bOrder ? 1 : 0;
  });

  return res.ok({
    project: {
      id: project.id,
      name: project.name,
      isArchived: project.isArchived,
      archivedAt: project.archivedAt,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      tasks: tasksWithSubtasks,
    },
  });
});

// PATCH /projects/:id - update project
api.register(patchProject, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const project = await projects.get({ userId }, { id: req.id });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const updatedProject = {
    ...project,
    ...(req.name !== undefined && { name: req.name }),
    updatedAt: Date.now(),
  };

  const updated = await projects.put(updatedProject);

  return res.ok({ project: updated });
});

// DELETE /projects/:id - delete project (cascades to all tasks)
api.register(deleteProject, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const project = await projects.get({ userId }, { id: req.id });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  // Delete all tasks in this project
  const projectTasks = await tasks.query({ userId, projectId: project.id }).all();
  await Promise.all(projectTasks.map((task) => tasks.delete({ userId, projectId: project.id }, { id: task.id })));

  // Delete the project
  await projects.delete({ userId }, { id: req.id });

  return res.noContent();
});

// POST /projects/:id/archive - archive project (sets TTL for auto-deletion)
api.register(archiveProject, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const project = await projects.get({ userId }, { id: req.id });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  const now = Date.now();
  const archiveTtl = ttl(LIMITS.ARCHIVE_TTL_DAYS, "day");

  // Update the project with archive status and TTL
  const updatedProject = await projects.put({
    ...project,
    isArchived: true,
    archivedAt: now,
    ttl: archiveTtl,
    updatedAt: now,
  });

  // Set TTL on all tasks in this project
  const projectTasks = await tasks.query({ userId, projectId: project.id }).all();
  await Promise.all(
    projectTasks.map((task) =>
      tasks.put({
        ...task,
        ttl: archiveTtl,
      }),
    ),
  );

  return res.ok({
    project: {
      id: updatedProject.id,
      name: updatedProject.name,
      isArchived: updatedProject.isArchived,
      archivedAt: updatedProject.archivedAt,
      createdAt: updatedProject.createdAt,
      updatedAt: updatedProject.updatedAt,
    },
  });
});

// POST /projects/:id/unarchive - unarchive project (removes TTL)
api.register(unarchiveProject, async (req, res, ctx) => {
  const { userId } = await ctx.getUser();
  const project = await projects.get({ userId }, { id: req.id });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  // Check active project limit (excluding current project since it's archived)
  const userProjects = await projects.query({ userId }).all();
  const activeCount = userProjects.filter((p) => !p.isArchived && p.id !== req.id).length;
  if (activeCount >= LIMITS.MAX_ACTIVE_PROJECTS) {
    throw new HttpError(403, LIMIT_MESSAGES.PROJECT);
  }

  const now = Date.now();

  // Update the project to remove archive status and TTL
  const updatedProject = await projects.put({
    ...project,
    isArchived: false,
    archivedAt: undefined,
    ttl: undefined,
    updatedAt: now,
  });

  // Remove TTL from all tasks in this project
  const projectTasks = await tasks.query({ userId, projectId: project.id }).all();
  await Promise.all(
    projectTasks.map((task) =>
      tasks.put({
        ...task,
        ttl: undefined,
      }),
    ),
  );

  return res.ok({
    project: {
      id: updatedProject.id,
      name: updatedProject.name,
      isArchived: updatedProject.isArchived,
      archivedAt: updatedProject.archivedAt,
      createdAt: updatedProject.createdAt,
      updatedAt: updatedProject.updatedAt,
    },
  });
});
