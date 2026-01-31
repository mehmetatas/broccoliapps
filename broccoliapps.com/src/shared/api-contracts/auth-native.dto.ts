import * as v from "valibot";
import { globalConfig } from "@broccoliapps/shared";
import { authUserDto } from "./dto";

// POST /v1/auth/verify-native - verify native sign-in (e.g. Apple on iOS)
export const verifyNativeRequest = {
  app: v.pipe(v.string(), v.picklist(Object.keys(globalConfig.apps))),
  code: v.pipe(v.string(), v.maxLength(1024)),
  email: v.pipe(v.string(), v.email()),
  name: v.string(),
  provider: v.picklist(["apple"]),
};
export type VerifyNativeRequest = v.InferOutput<v.ObjectSchema<typeof verifyNativeRequest, undefined>>;

export const verifyNativeResponse = {
  user: authUserDto,
};
export type VerifyNativeResponse = v.InferOutput<v.ObjectSchema<typeof verifyNativeResponse, undefined>>;
