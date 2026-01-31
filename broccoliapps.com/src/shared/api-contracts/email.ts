import { api, globalConfig } from "@broccoliapps/shared";
import * as v from "valibot";

// POST /v1/auth/email - send magic link email
export const sendMagicLinkRequest = {
  app: v.pipe(v.string(), v.picklist(Object.keys(globalConfig.apps))),
  email: v.pipe(v.string(), v.email()),
  code: v.pipe(v.string(), v.maxLength(1024)),
  platform: v.optional(v.picklist(["mobile"])),
};
export type SendMagicLinkRequest = v.InferOutput<v.ObjectSchema<typeof sendMagicLinkRequest, undefined>>;

export const sendMagicLinkResponse = {
  success: v.boolean(),
};
export type SendMagicLinkResponse = v.InferOutput<v.ObjectSchema<typeof sendMagicLinkResponse, undefined>>;

export const sendMagicLink = api("POST", "/v1/auth/email")
  .withRequest(sendMagicLinkRequest)
  .withResponse(sendMagicLinkResponse);
