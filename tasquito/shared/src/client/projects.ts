import {
  archiveProject as archiveProjectApi,
  deleteProject as deleteProjectApi,
  getProject as getProjectApi,
  getProjects as getProjectsApi,
  patchProject as patchProjectApi,
  postProject as postProjectApi,
  unarchiveProject as unarchiveProjectApi,
  type ProjectDto,
  type ProjectSummaryDto,
  type ProjectWithTasksDto,
} from "../api-contracts";
import { CACHE_KEYS, getCacheExpiry } from "./cache";
import { getCache } from "./init";

// Helper functions for cache management
const getAllProjectsFromCache = (): ProjectSummaryDto[] => {
  const keys = getCache().keys(CACHE_KEYS.projectPrefix);
  const projects: ProjectSummaryDto[] = [];
  for (const key of keys) {
    const project = getCache().get<ProjectSummaryDto>(key);
    if (project) projects.push(project);
  }
  return projects;
};

const setProjectInCache = (project: ProjectSummaryDto | ProjectDto) => {
  // Ensure task counts are present for cache
  const projectWithCounts: ProjectSummaryDto = {
    ...project,
    openTaskCount: "openTaskCount" in project ? project.openTaskCount : 0,
    totalTaskCount: "totalTaskCount" in project ? project.totalTaskCount : 0,
  };
  getCache().set(CACHE_KEYS.project(project.id), projectWithCounts, getCacheExpiry());
};

const setAllProjectsInCache = (projects: ProjectSummaryDto[]) => {
  for (const project of projects) {
    setProjectInCache(project);
  }
};

const removeProjectFromCache = (id: string) => {
  getCache().remove(CACHE_KEYS.project(id));
};

export const setProjectCountsInCache = (
  projectId: string,
  openTaskCount: number,
  totalTaskCount: number
): void => {
  const existing = getCache().get<ProjectSummaryDto>(CACHE_KEYS.project(projectId));
  if (!existing) return;
  getCache().set(CACHE_KEYS.project(projectId), { ...existing, openTaskCount, totalTaskCount }, getCacheExpiry());
};

// GET /projects - list all projects with cache
export const getProjects = async (): Promise<{ projects: ProjectSummaryDto[] }> => {
  const projectsFetched = getCache().get<boolean>(CACHE_KEYS.projectsFetched);
  if (projectsFetched) {
    const projects = getAllProjectsFromCache();
    if (projects.length > 0) return { projects };
  }

  const data = await getProjectsApi.invoke({});
  setAllProjectsInCache(data.projects);
  getCache().set(CACHE_KEYS.projectsFetched, true, getCacheExpiry());
  return data;
};

// GET /projects/:id - get single project with tasks
export const getProject = async (id: string): Promise<{ project: ProjectWithTasksDto }> => {
  // Always fetch fresh for detail view (has tasks)
  const data = await getProjectApi.invoke({ id });
  return data;
};

// POST /projects - create project with cache update
export const postProject = async (data: { name: string }): Promise<{ project: ProjectDto }> => {
  const result = await postProjectApi.invoke(data);
  setProjectInCache(result.project);
  return result;
};

// PATCH /projects/:id - update project with cache update
export const patchProject = async (data: { id: string; name?: string }): Promise<{ project: ProjectDto }> => {
  const result = await patchProjectApi.invoke(data);
  // Update cache - preserve task counts from existing cache if available
  const existing = getCache().get<ProjectSummaryDto>(CACHE_KEYS.project(result.project.id));
  setProjectInCache({
    ...result.project,
    openTaskCount: existing?.openTaskCount ?? 0,
    totalTaskCount: existing?.totalTaskCount ?? 0,
  });
  return result;
};

// DELETE /projects/:id - delete project with cache update
export const deleteProject = async (id: string): Promise<void> => {
  await deleteProjectApi.invoke({ id });
  removeProjectFromCache(id);
  // Also clear any cached tasks for this project
  getCache().removeByPrefix(CACHE_KEYS.taskPrefix(id));
  getCache().remove(CACHE_KEYS.tasksFetched(id));
};

// POST /projects/:id/archive - archive project with cache update
export const archiveProject = async (id: string): Promise<{ project: ProjectDto }> => {
  const result = await archiveProjectApi.invoke({ id });
  // Update the project in cache with archived status
  setProjectInCache(result.project);
  // Also clear any cached tasks for this project
  getCache().removeByPrefix(CACHE_KEYS.taskPrefix(id));
  getCache().remove(CACHE_KEYS.tasksFetched(id));
  return result;
};

// POST /projects/:id/unarchive - unarchive project with cache update
export const unarchiveProject = async (id: string): Promise<{ project: ProjectDto }> => {
  const result = await unarchiveProjectApi.invoke({ id });
  // Update the project in cache with unarchived status
  setProjectInCache(result.project);
  return result;
};

// Invalidate all projects cache
export const invalidateProjectsCache = () => {
  getCache().removeByPrefix(CACHE_KEYS.projectPrefix);
  getCache().remove(CACHE_KEYS.projectsFetched);
};
