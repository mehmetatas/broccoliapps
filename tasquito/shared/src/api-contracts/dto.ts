import * as v from "valibot";

// ============================================================================
// Task Status Schema
// ============================================================================
export const taskStatusSchema = v.picklist(["todo", "done"]);
export type TaskStatus = v.InferOutput<typeof taskStatusSchema>;

// ============================================================================
// Task DTO
// ============================================================================
export const taskDto = {
  id: v.string(),
  projectId: v.string(),
  parentId: v.optional(v.string()),
  title: v.string(),
  description: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  status: taskStatusSchema,
  sortOrder: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export type TaskDto = v.InferOutput<v.ObjectSchema<typeof taskDto, undefined>>;

// ============================================================================
// Project DTO
// ============================================================================
export const projectDto = {
  id: v.string(),
  name: v.string(),
  isArchived: v.optional(v.boolean()),
  archivedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
};
export type ProjectDto = v.InferOutput<v.ObjectSchema<typeof projectDto, undefined>>;

// Project with tasks for detail view
export const projectWithTasksDto = {
  ...projectDto,
  tasks: v.array(
    v.object({
      ...taskDto,
      subtasks: v.array(v.object(taskDto)),
    })
  ),
};
export type ProjectWithTasksDto = v.InferOutput<v.ObjectSchema<typeof projectWithTasksDto, undefined>>;

// Project summary for list view (includes task counts)
export const projectSummaryDto = {
  ...projectDto,
  openTaskCount: v.number(),
  totalTaskCount: v.number(),
};
export type ProjectSummaryDto = v.InferOutput<v.ObjectSchema<typeof projectSummaryDto, undefined>>;

// ============================================================================
// Common schemas for reuse
// ============================================================================
export const idRequest = {
  id: v.string(),
};
export type IdRequest = v.InferOutput<v.ObjectSchema<typeof idRequest, undefined>>;

export const projectIdRequest = {
  projectId: v.string(),
};
export type ProjectIdRequest = v.InferOutput<v.ObjectSchema<typeof projectIdRequest, undefined>>;
