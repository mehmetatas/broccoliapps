import { JwtData } from "@broccoliapps/backend/dist/auth/jwt";
import { api } from "@broccoliapps/shared";
import * as v from "valibot";

export const verifyAuthToken = api("POST", "/v1/auth/verify")
  .withRequest({
    app: v.pipe(v.string(), v.picklist(["expense-tracker"])),
    code: v.pipe(v.string(), v.maxLength(64)),
    signature: v.pipe(v.string(), v.maxLength(256)),
  })
  .withResponse<JwtData>();
