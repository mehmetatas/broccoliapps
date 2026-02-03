import { api } from "./contract";
import { getUserPreferencesResponse, setUserPreferenceRequest, setUserPreferenceResponse } from "./preferences.dto";

// GET /user/preferences - get all user preferences
export const getUserPreferences = api("GET", "/user/preferences").withResponse(getUserPreferencesResponse);

// PUT /user/preferences/:key - set a single preference
export const setUserPreference = api("PUT", "/user/preferences/:key").withRequest(setUserPreferenceRequest).withResponse(setUserPreferenceResponse);
