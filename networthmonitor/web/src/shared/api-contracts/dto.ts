import * as v from "valibot";

// ============================================================================
// Update Frequency
// ============================================================================
export const updateFrequencySchema = v.picklist(["monthly", "quarterly", "biannually", "yearly"]);
export type UpdateFrequency = v.InferOutput<typeof updateFrequencySchema>;

// ============================================================================
// History Schema (Record<month, value>)
// ============================================================================
export const historySchema = v.record(v.string(), v.number());
export type History = v.InferOutput<typeof historySchema>;

// ============================================================================
// Account DTO
// ============================================================================
export const accountDto = {
  id: v.string(),
  name: v.string(),
  type: v.picklist(["asset", "debt"]),
  currency: v.string(),
  archivedAt: v.optional(v.number()),
  bucketIds: v.optional(v.array(v.string())),
  updateFrequency: v.optional(updateFrequencySchema),
  nextUpdate: v.optional(v.string()),
  history: v.optional(historySchema),
};
export type AccountDto = v.InferOutput<v.ObjectSchema<typeof accountDto, undefined>>;

// ============================================================================
// Bucket DTO
// ============================================================================
export const bucketDto = {
  id: v.string(),
  name: v.string(),
  accountIds: v.optional(v.array(v.string())),
};
export type BucketDto = v.InferOutput<v.ObjectSchema<typeof bucketDto, undefined>>;

// ============================================================================
// User DTO
// ============================================================================
export const userDto = {
  id: v.string(),
  name: v.string(),
  email: v.string(),
  targetCurrency: v.string(),
};
export type UserDto = v.InferOutput<v.ObjectSchema<typeof userDto, undefined>>;

// ============================================================================
// Auth User DTO
// ============================================================================
export const authUserDto = {
  id: v.string(),
  email: v.string(),
  name: v.string(),
  isNewUser: v.boolean(),
  targetCurrency: v.nullable(v.string()),
};
export type AuthUserDto = v.InferOutput<v.ObjectSchema<typeof authUserDto, undefined>>;

// ============================================================================
// Common schemas for reuse
// ============================================================================
export const idRequest = {
  id: v.string(),
};
export type IdRequest = v.InferOutput<v.ObjectSchema<typeof idRequest, undefined>>;
