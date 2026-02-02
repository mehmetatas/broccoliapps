import { AppId, globalConfig } from "@broccoliapps/shared";
import * as jose from "jose";
import { params } from "../params";
import { getAuthConfig } from "./config";

const ALGORITHM = "RS256";

export type JwtData = {
  userId: string;
  email: string;
  name: string;
  provider: string;
};

const privateKeyCache = new Map<AppId, CryptoKey>();
const publicKeyCache = new Map<AppId, CryptoKey>();

const getPrivateKey = async (appId: AppId): Promise<CryptoKey> => {
  const cached = privateKeyCache.get(appId);
  if (cached) {
    return cached;
  }

  const pem = await params.getAppKey(appId);
  const key = await jose.importPKCS8(pem, ALGORITHM);
  privateKeyCache.set(appId, key as CryptoKey);
  return key as CryptoKey;
};

const getPublicKey = async (appId: AppId): Promise<CryptoKey> => {
  const cached = publicKeyCache.get(appId);
  if (cached) {
    return cached;
  }

  const pem = globalConfig.apps[appId].publicKey;
  const key = await jose.importSPKI(pem, ALGORITHM);
  publicKeyCache.set(appId, key as CryptoKey);
  return key as CryptoKey;
};

const sign = async (data: JwtData): Promise<string> => {
  const { appId, accessTokenLifetime } = getAuthConfig();
  const key = await getPrivateKey(appId);

  return new jose.SignJWT({ data })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(data.userId)
    .setIssuer(appId)
    .setExpirationTime(`${accessTokenLifetime.toSeconds()}s`)
    .sign(key);
};

const verify = async (token: string): Promise<{ data: JwtData; exp: number } | undefined> => {
  const { appId } = getAuthConfig();
  const key = await getPublicKey(appId);

  try {
    const { payload } = await jose.jwtVerify(token, key, {
      algorithms: [ALGORITHM],
      issuer: appId,
    });
    return { data: payload.data as JwtData, exp: payload.exp! };
  } catch {
    return undefined;
  }
};

export const jwt = {
  sign,
  verify,
};
