import * as v from "valibot";
import { LIMITS } from "../limits";
import { idRequest, projectDto, projectSummaryDto, projectWithTasksDto } from "./dto";

// ============================================================================
// POST /projects - create project
// ============================================================================
export const postProjectRequest = {
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(LIMITS.MAX_PROJECT_NAME_LENGTH)),
};
export type PostProjectRequest = v.InferOutput<v.ObjectSchema<typeof postProjectRequest, undefined>>;

export const postProjectResponse = {
  project: v.object(projectDto),
};
export type PostProjectResponse = v.InferOutput<v.ObjectSchema<typeof postProjectResponse, undefined>>;

// ============================================================================
// GET /projects - list all projects
// ============================================================================
export const getProjectsResponse = {
  projects: v.array(v.object(projectSummaryDto)),
};
export type GetProjectsResponse = v.InferOutput<v.ObjectSchema<typeof getProjectsResponse, undefined>>;

// ============================================================================
// GET /projects/:id - get single project with tasks
// ============================================================================
export const getProjectRequest = idRequest;
export type GetProjectRequest = v.InferOutput<v.ObjectSchema<typeof getProjectRequest, undefined>>;

export const getProjectResponse = {
  project: v.object(projectWithTasksDto),
};
export type GetProjectResponse = v.InferOutput<v.ObjectSchema<typeof getProjectResponse, undefined>>;

// ============================================================================
// PATCH /projects/:id - update project
// ============================================================================
export const patchProjectRequest = {
  id: v.string(),
  name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(LIMITS.MAX_PROJECT_NAME_LENGTH))),
};
export type PatchProjectRequest = v.InferOutput<v.ObjectSchema<typeof patchProjectRequest, undefined>>;

export const patchProjectResponse = {
  project: v.object(projectDto),
};
export type PatchProjectResponse = v.InferOutput<v.ObjectSchema<typeof patchProjectResponse, undefined>>;

// ============================================================================
// DELETE /projects/:id - delete project (cascades to all tasks)
// ============================================================================
export const deleteProjectRequest = idRequest;
export type DeleteProjectRequest = v.InferOutput<v.ObjectSchema<typeof deleteProjectRequest, undefined>>;

// ============================================================================
// POST /projects/:id/archive - archive project (sets TTL for auto-deletion)
// ============================================================================
export const archiveProjectRequest = idRequest;
export type ArchiveProjectRequest = v.InferOutput<v.ObjectSchema<typeof archiveProjectRequest, undefined>>;

export const archiveProjectResponse = {
  project: v.object(projectDto),
};
export type ArchiveProjectResponse = v.InferOutput<v.ObjectSchema<typeof archiveProjectResponse, undefined>>;

// ============================================================================
// POST /projects/:id/unarchive - unarchive project (removes TTL)
// ============================================================================
export const unarchiveProjectRequest = idRequest;
export type UnarchiveProjectRequest = v.InferOutput<v.ObjectSchema<typeof unarchiveProjectRequest, undefined>>;

export const unarchiveProjectResponse = {
  project: v.object(projectDto),
};
export type UnarchiveProjectResponse = v.InferOutput<v.ObjectSchema<typeof unarchiveProjectResponse, undefined>>;
