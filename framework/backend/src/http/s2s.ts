import { type AppId, Duration, globalConfig } from "@broccoliapps/shared";
import { crypto } from "../crypto";
import { HttpError } from "./page-router";

const MAX_TIMESTAMP_AGE_MS = Duration.seconds(15).toMilliseconds();

export const verifyS2SRequest = (appId: string, timestamp: string, signature: string, path: string, body?: string): void => {
  // 1. Validate appId is known
  if (!(appId in globalConfig.apps)) {
    throw new HttpError(401, "Unknown app");
  }

  // 2. Reject if timestamp is too old
  const age = Date.now() - parseInt(timestamp);
  if (isNaN(age) || age > MAX_TIMESTAMP_AGE_MS) {
    throw new HttpError(401, "Request expired");
  }

  // 3. Reconstruct payload with keys sorted alphabetically
  const payload: Record<string, string> = { appId, path, timestamp };
  if (body !== undefined) {
    payload.body = body;
  }
  const sorted = JSON.stringify(payload, Object.keys(payload).sort());

  // 4. Hash the sorted payload
  const hash = crypto.sha256(sorted);

  // 5. Decrypt signature with app's public key and compare
  let decrypted: string;
  try {
    decrypted = crypto.rsaPublicDecrypt(appId as AppId, signature);
  } catch {
    throw new HttpError(401, "Invalid signature");
  }

  if (decrypted !== hash) {
    throw new HttpError(401, "Invalid signature");
  }
};
