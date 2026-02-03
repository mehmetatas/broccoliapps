import { AppId, globalConfig } from "@broccoliapps/shared";
import { createCipheriv, createDecipheriv, createHash, privateDecrypt, privateEncrypt, publicDecrypt, publicEncrypt, randomBytes } from "crypto";
import { params } from "./params";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let cachedKey: Buffer | null = null;

const getSharedKey = async (): Promise<Buffer> => {
  if (cachedKey) {
    return cachedKey;
  }
  // TODO: Access to this SSM param from different services is not configured in CDK
  const keyBase64 = await params.get("/broccoliapps/shared-aes-key");
  cachedKey = Buffer.from(keyBase64, "base64");
  return cachedKey;
};

const encrypt = async (plaintext: string): Promise<string> => {
  const key = await getSharedKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const result = Buffer.concat([iv, authTag, encrypted]);
  return result.toString("base64url");
};

const decrypt = async (ciphertext: string): Promise<string> => {
  const key = await getSharedKey();
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

const sha256 = (data: string): string => {
  return createHash("sha256").update(data).digest("hex");
};

const rsaPublicDecrypt = (appId: AppId, ciphertext: string): string => {
  const { publicKey } = globalConfig.apps[appId];
  const decrypted = publicDecrypt(publicKey, Buffer.from(ciphertext, "base64url"));
  return decrypted.toString("utf8");
};

const rsaPublicEncrypt = (appId: AppId, plaintext: string): string => {
  const { publicKey } = globalConfig.apps[appId];
  const encrypted = publicEncrypt(publicKey, Buffer.from(plaintext, "utf8"));
  return encrypted.toString("base64url");
};

const rsaPrivateDecrypt = async (appId: AppId, ciphertext: string): Promise<string> => {
  const privateKey = await params.getAppKey(appId);
  const decrypted = privateDecrypt(privateKey, Buffer.from(ciphertext, "base64url"));
  return decrypted.toString("utf8");
};

const rsaPrivateEncrypt = async (appId: AppId, plaintext: string): Promise<string> => {
  const privateKey = await params.getAppKey(appId);
  const encrypted = privateEncrypt(privateKey, Buffer.from(plaintext, "utf8"));
  return encrypted.toString("base64url");
};

export const crypto = {
  encrypt,
  decrypt,
  sha256,
  rsaPublicEncrypt,
  rsaPrivateDecrypt,
  rsaPrivateEncrypt,
  rsaPublicDecrypt,
};
