import { api } from "@broccoliapps/shared";
import {
  deleteAccountRequest,
  deleteHistoryItemRequest,
  deleteHistoryItemResponse,
  getAccountBucketsRequest,
  getAccountBucketsResponse,
  getAccountDetailRequest,
  getAccountDetailResponse,
  getAccountHistoryRequest,
  getAccountHistoryResponse,
  getAccountRequest,
  getAccountResponse,
  getAccountsResponse,
  patchAccountRequest,
  patchAccountResponse,
  postAccountRequest,
  postAccountResponse,
  postHistoryItemRequest,
  postHistoryItemResponse,
  putAccountBucketsRequest,
} from "./accounts.dto";

// POST /accounts - create account with history items
export const postAccountApi = api("POST", "/accounts").withRequest(postAccountRequest).withResponse(postAccountResponse);

// GET /accounts - list all accounts
export const getAccountsApi = api("GET", "/accounts").withResponse(getAccountsResponse);

// GET /accounts/:id - get single account
export const getAccountApi = api("GET", "/accounts/:id").withRequest(getAccountRequest).withResponse(getAccountResponse);

// DELETE /accounts/:id - delete account and all history
export const deleteAccountApi = api("DELETE", "/accounts/:id").withRequest(deleteAccountRequest);

// PATCH /accounts/:id - update account
export const patchAccountApi = api("PATCH", "/accounts/:id").withRequest(patchAccountRequest).withResponse(patchAccountResponse);

// GET /accounts/:id/history - get history items for account
export const getAccountHistoryApi = api("GET", "/accounts/:id/history").withRequest(getAccountHistoryRequest).withResponse(getAccountHistoryResponse);

// POST /accounts/:id/history-item - add/update a single history item
export const postHistoryItemApi = api("POST", "/accounts/:id/history-item").withRequest(postHistoryItemRequest).withResponse(postHistoryItemResponse);

// DELETE /accounts/:id/history-item/:month - delete a single history item
export const deleteHistoryItemApi = api("DELETE", "/accounts/:id/history-item/:month")
  .withRequest(deleteHistoryItemRequest)
  .withResponse(deleteHistoryItemResponse);

// GET /accounts/:id/buckets - get buckets for an account
export const getAccountBucketsApi = api("GET", "/accounts/:id/buckets").withRequest(getAccountBucketsRequest).withResponse(getAccountBucketsResponse);

// PUT /accounts/:id/buckets - set buckets for an account
export const putAccountBucketsApi = api("PUT", "/accounts/:id/buckets").withRequest(putAccountBucketsRequest);

// GET /accounts/:id/detail - get account with all related data
export const getAccountDetailApi = api("GET", "/accounts/:id/detail").withRequest(getAccountDetailRequest).withResponse(getAccountDetailResponse);
