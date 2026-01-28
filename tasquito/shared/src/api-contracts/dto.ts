import * as v from "valibot";

// ============================================================================
// Auth User DTO
// ============================================================================
export const authUserDto = {
  id: v.string(),
  email: v.string(),
  name: v.string(),
  isNewUser: v.boolean(),
};
export type AuthUserDto = v.InferOutput<v.ObjectSchema<typeof authUserDto, undefined>>;

// ============================================================================
// Task Status Schema
// ============================================================================
export const taskStatusSchema = v.picklist(["todo", "in_progress", "done"]);
export type TaskStatus = v.InferOutput<typeof taskStatusSchema>;

// ============================================================================
// Task DTO
// ============================================================================
export const taskDto = {
  id: v.string(),
  title: v.string(),
  status: taskStatusSchema,
  createdAt: v.number(),
  updatedAt: v.number(),
};
export type TaskDto = v.InferOutput<v.ObjectSchema<typeof taskDto, undefined>>;

// ============================================================================
// Common schemas for reuse
// ============================================================================
export const idRequest = {
  id: v.string(),
};
export type IdRequest = v.InferOutput<v.ObjectSchema<typeof idRequest, undefined>>;
