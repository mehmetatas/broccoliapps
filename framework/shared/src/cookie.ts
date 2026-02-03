const MAX_MAX_AGE = 31536000;

// v1 tokens were issued by Cognito
// v2 tokens are signed by our own private key
export const ACCESS_TOKEN_COOKIE_KEY = "access_token_v2";
export const REFRESH_TOKEN_COOKIE_KEY = "refresh_token_v2";
export const SESSION_TOKEN_COOKIE_KEY = "session_token";

export class Cookie {
  constructor(
    public readonly key: string,
    public readonly value: string,
    private readonly options: CookieOptions = {},
  ) {}

  toString() {
    let cookieString = `${this.key}=${encodeURIComponent(this.value)}`;

    if (typeof this.options.maxAge === "number") {
      cookieString += `; Max-Age=${this.options.maxAge}`;
    } else if (this.options.maxAge === "max") {
      cookieString += `; Max-Age=${MAX_MAX_AGE}`;
    }

    if (this.options.path) {
      cookieString += `; Path=${this.options.path}`;
    }

    if (this.options.sameSite) {
      cookieString += `; SameSite=${this.options.sameSite}`;
    }

    if (this.options.secure) {
      cookieString += "; Secure";
    }

    if (this.options.httpOnly) {
      cookieString += "; HttpOnly";
    }

    return cookieString;
  }

  public static delete(key: string, options: Omit<CookieOptions, "maxAge"> = {}) {
    return new Cookie(key, "", { ...options, maxAge: 0 });
  }
}

export type CookieOptions = {
  maxAge?: number | "max";
  path?: string;
  sameSite?: "lax" | "strict";
  secure?: boolean;
  httpOnly?: boolean;
};
