import type { Cookie } from "@broccoliapps/shared";
import type { Context } from "hono";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import * as v from "valibot";

export const setCookies = (c: Context, cookies?: Cookie[]): void => {
  if (!cookies) {
    return;
  }
  for (const cookie of cookies) {
    c.header(
      "Set-Cookie",
      `${cookie.name}=${cookie.value}` +
        (cookie.maxAge !== undefined ? `; Max-Age=${cookie.maxAge}` : "") +
        (cookie.path ? `; Path=${cookie.path}` : "") +
        (cookie.domain ? `; Domain=${cookie.domain}` : "") +
        (cookie.secure ? "; Secure" : "") +
        (cookie.httpOnly ? "; HttpOnly" : "") +
        (cookie.sameSite ? `; SameSite=${cookie.sameSite}` : ""),
      { append: true }
    );
  }
};

export const handleError = (c: Context, error: unknown): Response => {
  if (error instanceof v.ValiError) {
    return c.json(
      {
        error: "Validation Error",
        issues: error.issues.map((issue) => ({
          path: issue.path?.map((p: { key: string | number }) => p.key).join("."),
          message: issue.message,
        })),
      },
      400
    );
  }

  console.error("Request error:", error);

  if (error instanceof Error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ error: "Unknown error" }, 500);
};

export class HttpRouter {
  protected hono: Hono;

  constructor() {
    this.hono = new Hono();
  }

  /**
   * Hono fetch handler for dev server
   */
  get fetch() {
    return this.hono.fetch.bind(this.hono);
  }

  /**
   * Creates the Lambda handler
   */
  lambdaHandler() {
    return handle(this.hono);
  }
}
