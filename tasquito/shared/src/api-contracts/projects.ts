import { api } from "@broccoliapps/shared";
import {
  archiveProjectRequest,
  archiveProjectResponse,
  deleteProjectRequest,
  getProjectRequest,
  getProjectResponse,
  getProjectsResponse,
  patchProjectRequest,
  patchProjectResponse,
  postProjectRequest,
  postProjectResponse,
  unarchiveProjectRequest,
  unarchiveProjectResponse,
} from "./projects.dto";

// POST /projects - create project
export const postProject = api("POST", "/projects").withRequest(postProjectRequest).withResponse(postProjectResponse);

// GET /projects - list all projects
export const getProjects = api("GET", "/projects").withResponse(getProjectsResponse);

// GET /projects/:id - get single project with tasks
export const getProject = api("GET", "/projects/:id").withRequest(getProjectRequest).withResponse(getProjectResponse);

// PATCH /projects/:id - update project
export const patchProject = api("PATCH", "/projects/:id").withRequest(patchProjectRequest).withResponse(patchProjectResponse);

// DELETE /projects/:id - delete project (cascades to all tasks)
export const deleteProject = api("DELETE", "/projects/:id").withRequest(deleteProjectRequest);

// POST /projects/:id/archive - archive project (sets TTL for auto-deletion)
export const archiveProject = api("POST", "/projects/:id/archive").withRequest(archiveProjectRequest).withResponse(archiveProjectResponse);

// POST /projects/:id/unarchive - unarchive project (removes TTL)
export const unarchiveProject = api("POST", "/projects/:id/unarchive").withRequest(unarchiveProjectRequest).withResponse(unarchiveProjectResponse);
