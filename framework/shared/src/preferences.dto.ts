import * as v from "valibot";

const preferenceValue = v.union([v.string(), v.number(), v.boolean()]);

// ============================================================================
// GET /user/preferences - get all preferences
// ============================================================================
export const getUserPreferencesResponse = {
  preferences: v.record(v.string(), preferenceValue),
};
export type GetUserPreferencesResponse = v.InferOutput<v.ObjectSchema<typeof getUserPreferencesResponse, undefined>>;

// ============================================================================
// PUT /user/preferences/:key - set a single preference
// ============================================================================
export const setUserPreferenceRequest = {
  key: v.string(),
  value: preferenceValue,
};
export type SetUserPreferenceRequest = v.InferOutput<v.ObjectSchema<typeof setUserPreferenceRequest, undefined>>;

export const setUserPreferenceResponse = {
  key: v.string(),
  value: preferenceValue,
};
export type SetUserPreferenceResponse = v.InferOutput<v.ObjectSchema<typeof setUserPreferenceResponse, undefined>>;
