import * as v from "valibot";
import { accountDto, bucketDto, historySchema, idRequest, updateFrequencySchema } from "./dto";

// ============================================================================
// POST /accounts - create account
// ============================================================================
export const postAccountRequest = {
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  type: v.picklist(["asset", "debt"]),
  currency: v.pipe(v.string(), v.minLength(1), v.maxLength(10)),
  updateFrequency: updateFrequencySchema,
  history: v.pipe(historySchema, v.minEntries(1)),
};
export type PostAccountRequest = v.InferOutput<v.ObjectSchema<typeof postAccountRequest, undefined>>;

export const postAccountResponse = {
  account: v.object(accountDto),
};
export type PostAccountResponse = v.InferOutput<v.ObjectSchema<typeof postAccountResponse, undefined>>;

// ============================================================================
// GET /accounts - list all accounts
// ============================================================================
export const getAccountsResponse = {
  accounts: v.array(v.object(accountDto)),
};
export type GetAccountsResponse = v.InferOutput<v.ObjectSchema<typeof getAccountsResponse, undefined>>;

// ============================================================================
// GET /accounts/:id - get single account
// ============================================================================
export const getAccountRequest = idRequest;
export type GetAccountRequest = v.InferOutput<v.ObjectSchema<typeof getAccountRequest, undefined>>;

export const getAccountResponse = {
  account: v.object(accountDto),
};
export type GetAccountResponse = v.InferOutput<v.ObjectSchema<typeof getAccountResponse, undefined>>;

// ============================================================================
// DELETE /accounts/:id - delete account
// ============================================================================
export const deleteAccountRequest = idRequest;
export type DeleteAccountRequest = v.InferOutput<v.ObjectSchema<typeof deleteAccountRequest, undefined>>;

// ============================================================================
// PATCH /accounts/:id - update account
// ============================================================================
export const patchAccountRequest = {
  id: v.string(),
  name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  archivedAt: v.optional(v.union([v.number(), v.null_()])),
};
export type PatchAccountRequest = v.InferOutput<v.ObjectSchema<typeof patchAccountRequest, undefined>>;

export const patchAccountResponse = {
  account: v.object(accountDto),
};
export type PatchAccountResponse = v.InferOutput<v.ObjectSchema<typeof patchAccountResponse, undefined>>;

// ============================================================================
// GET /accounts/:id/history - get history
// ============================================================================
export const getAccountHistoryRequest = idRequest;
export type GetAccountHistoryRequest = v.InferOutput<v.ObjectSchema<typeof getAccountHistoryRequest, undefined>>;

export const getAccountHistoryResponse = {
  history: historySchema,
};
export type GetAccountHistoryResponse = v.InferOutput<v.ObjectSchema<typeof getAccountHistoryResponse, undefined>>;

// ============================================================================
// POST /accounts/:id/history-item - add/update a single history item
// ============================================================================
export const postHistoryItemRequest = {
  id: v.string(), // accountId from URL
  month: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}$/, "Month must be in yyyy-mm format")),
  value: v.number(),
};
export type PostHistoryItemRequest = v.InferOutput<v.ObjectSchema<typeof postHistoryItemRequest, undefined>>;

export const postHistoryItemResponse = {
  month: v.string(),
  value: v.number(),
  nextUpdate: v.optional(v.string()),
};
export type PostHistoryItemResponse = v.InferOutput<v.ObjectSchema<typeof postHistoryItemResponse, undefined>>;

// ============================================================================
// DELETE /accounts/:id/history-item/:month - delete a single history item
// ============================================================================
export const deleteHistoryItemRequest = {
  id: v.string(), // accountId from URL
  month: v.pipe(v.string(), v.regex(/^\d{4}-\d{2}$/, "Month must be in yyyy-mm format")),
};
export type DeleteHistoryItemRequest = v.InferOutput<v.ObjectSchema<typeof deleteHistoryItemRequest, undefined>>;

export const deleteHistoryItemResponse = {
  success: v.boolean(),
  nextUpdate: v.optional(v.string()),
};
export type DeleteHistoryItemResponse = v.InferOutput<v.ObjectSchema<typeof deleteHistoryItemResponse, undefined>>;

// ============================================================================
// GET /accounts/:id/buckets - get buckets for an account
// ============================================================================
export const getAccountBucketsRequest = idRequest;
export type GetAccountBucketsRequest = v.InferOutput<v.ObjectSchema<typeof getAccountBucketsRequest, undefined>>;

export const getAccountBucketsResponse = {
  buckets: v.array(v.object(bucketDto)),
};
export type GetAccountBucketsResponse = v.InferOutput<v.ObjectSchema<typeof getAccountBucketsResponse, undefined>>;

// ============================================================================
// PUT /accounts/:id/buckets - set buckets for an account
// ============================================================================
export const putAccountBucketsRequest = {
  id: v.string(),
  bucketIds: v.array(v.string()),
};
export type PutAccountBucketsRequest = v.InferOutput<v.ObjectSchema<typeof putAccountBucketsRequest, undefined>>;

// ============================================================================
// GET /accounts/:id/detail - get account with all related data
// ============================================================================
export const getAccountDetailRequest = idRequest;
export type GetAccountDetailRequest = v.InferOutput<v.ObjectSchema<typeof getAccountDetailRequest, undefined>>;

export const getAccountDetailResponse = {
  account: v.object(accountDto),
  accountBuckets: v.array(v.object(bucketDto)),
  allBuckets: v.array(v.object(bucketDto)),
};
export type GetAccountDetailResponse = v.InferOutput<v.ObjectSchema<typeof getAccountDetailResponse, undefined>>;
