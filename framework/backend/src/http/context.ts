import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { auth } from "../auth";
import { JwtData } from "../auth/jwt";
import { HttpError } from "./page-router";

/**
 * Request context passed to handlers.
 * Wraps Hono's Context to provide a cleaner API and hide implementation details.
 */
export class RequestContext {
  private user: JwtData | undefined;

  constructor(private ctx: Context) { }

  /**
   * Get a request header value
   */
  getHeader = (name: string): string | undefined => {
    return this.ctx.req.header(name);
  };

  /**
   * Get a cookie value
   */
  getCookie = (name: string): string | undefined => {
    return getCookie(this.ctx, name);
  };

  getUser = async (): Promise<JwtData> => {
    if (this.user) {
      return this.user;
    }
    // TODO: For SSR apps we should use cookies not headers
    const accessToken = this.ctx.req.header("x-access-token");
    if (!accessToken) {
      throw new HttpError(401, "Access token not found");
    }

    this.user = await auth.verifyAccessToken(accessToken);
    if (!this.user) {
      throw new HttpError(401, "Access token is invalid or expired");
    }

    return this.user;
  };
}
