import * as v from "valibot";
import type { HttpMethod, Schema } from "./types";

// API Error class for client-side error handling
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Empty schema for contracts without request body
export const emptySchema = v.object({});
export type EmptyRequest = v.InferOutput<typeof emptySchema>;

// Full contract - just data, no impl/invoke methods
// Use impl() from backend and invoke() from frontend
export class FullContract<TReq extends Record<string, unknown>, TRes> {
  readonly _response!: TRes; // phantom type for type inference

  constructor(
    public readonly method: HttpMethod,
    public readonly path: string,
    public readonly schema: Schema<TReq>
  ) {}
}

// Builder: after .withRequest() - IS a contract (defaults to void), can add .withResponse<T>()
export class ContractWithRequest<TReq extends Record<string, unknown>> extends FullContract<TReq, void> {
  withResponse<TRes>(): FullContract<TReq, TRes> {
    return new FullContract<TReq, TRes>(this.method, this.path, this.schema);
  }
}

// Builder: initial state - IS a contract (defaults to void), can add .withRequest() or .withResponse<T>()
export class ContractBuilder extends FullContract<EmptyRequest, void> {
  constructor(method: HttpMethod, path: string) {
    super(method, path, emptySchema);
  }

  withRequest<TReq extends v.ObjectEntries>(
    entries: TReq
  ): ContractWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>> {
    const schema = v.object(entries);
    return new ContractWithRequest<v.InferOutput<v.ObjectSchema<TReq, undefined>>>(this.method, this.path, schema);
  }

  withResponse<TRes>(): FullContract<EmptyRequest, TRes> {
    return new FullContract<EmptyRequest, TRes>(this.method, this.path, emptySchema);
  }
}

export const contract = (method: HttpMethod, path: string): ContractBuilder =>
  new ContractBuilder(method, path);

// API contract - auto-adds /api prefix
export const api = (method: HttpMethod, path: string): ContractBuilder =>
  new ContractBuilder(method, `/api${path}`);
