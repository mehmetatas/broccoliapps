import type { Context } from "hono";
import { getCookie } from "hono/cookie";

/**
 * Request context passed to handlers.
 * Wraps Hono's Context to provide a cleaner API and hide implementation details.
 */
export class RequestContext {
  constructor(private ctx: Context) {}

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
}
