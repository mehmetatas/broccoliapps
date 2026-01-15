import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { params } from "./params";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

const getKey = async (): Promise<Buffer> => {
  if (cachedKey) {
    return cachedKey;
  }
  const keyBase64 = await params.get("/broccoliapps/shared-aes-key");
  cachedKey = Buffer.from(keyBase64, "base64");
  return cachedKey;
};

export const encrypt = async (plaintext: string): Promise<string> => {
  const key = await getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString("base64url");
};

export const decrypt = async (ciphertext: string): Promise<string> => {
  const key = await getKey();
  const data = Buffer.from(ciphertext, "base64url");

  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};
