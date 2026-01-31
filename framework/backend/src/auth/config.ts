import { AppId, Duration, globalConfig } from "@broccoliapps/shared";
import { HttpError } from "../http";

export type AuthConfig = {
  appId: AppId;
  accessTokenLifetime: Duration;
  refreshTokenLifetime: Duration;
};

let config: AuthConfig | undefined;

/** Default token lifetimes shared across all apps */
const defaultLifetimes = () => ({
  accessTokenLifetime: globalConfig.isProd ? Duration.days(1) : Duration.minutes(5),
  refreshTokenLifetime: globalConfig.isProd ? Duration.years(1) : Duration.hours(1),
});

/**
 * Returns the current auth config.
 * Auto-initializes from BA_APP_ID env var on first access.
 */
export const getAuthConfig = (): AuthConfig => {
  if (config) return config;

  const envAppId = process.env.BA_APP_ID as AppId | undefined;
  if (envAppId && envAppId in globalConfig.apps) {
    config = { appId: envAppId, ...defaultLifetimes() };
    return config;
  }

  throw new HttpError(500, "Auth config is not set. Set the BA_APP_ID env var.");
};
