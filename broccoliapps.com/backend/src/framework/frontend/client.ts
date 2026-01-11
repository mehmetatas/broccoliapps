import { ApiError, type FullContract } from "../shared";

// Extract path param names from path (e.g., "/users/:id" -> ["id"])
const extractPathParams = (path: string): string[] => {
  const matches = path.match(/:([^/]+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
};

type InvokeOptions = {
  baseUrl?: string;
};

/**
 * Invoke a contract from the client side
 *
 * @example
 * const result = await invoke(createUser, {
 *   name: "John",
 *   email: "john@example.com",
 *   password: "secret123"
 * }, { baseUrl: "https://api.example.com" });
 */
export const invoke = async <TReq extends Record<string, unknown>, TRes>(
  contract: FullContract<TReq, TRes>,
  request: TReq,
  options?: InvokeOptions
): Promise<TRes> => {
  const pathParams = extractPathParams(contract.path);
  let url = (options?.baseUrl ?? "") + contract.path;
  const remaining = { ...request };

  // Replace path params in URL
  for (const param of pathParams) {
    if (param in remaining) {
      url = url.replace(`:${param}`, String(remaining[param]));
      delete remaining[param];
    }
  }

  const hasBody = contract.method !== "GET" && contract.method !== "DELETE";

  // GET or DELETE: remaining goes to query string
  if (!hasBody) {
    const entries = Object.entries(remaining).filter(([, v]) => v !== undefined);
    if (entries.length > 0) {
      const qs = new URLSearchParams(entries.map(([k, v]) => [k, String(v)]));
      url += "?" + qs.toString();
    }
  }

  const response = await fetch(url, {
    method: contract.method,
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(remaining) : undefined,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new ApiError(response.status, err.code ?? "UNKNOWN", err.message ?? "Request failed");
  }

  return response.json();
};

export { ApiError };
