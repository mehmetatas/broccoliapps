import { api } from "@broccoliapps/shared";
import * as v from "valibot";

export const postAuthExchange = api("POST", "/auth/exchange")
  .withRequest({
    code: v.pipe(v.string(), v.maxLength(1024)),
  })
  .withResponse<{
    accessToken: string;
    accessTokenExpiresAt: number;
    refreshToken: string;
    refreshTokenExpiresAt: number;
  }>();
