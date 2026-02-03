export type JwtPayload = {
  sub: string; // User ID
  exp: number; // epoch time in seconds
  iat: number; // epoch time in seconds
  iss: string;
  // not used
  // jti: string;
  // aud: string;
} & Record<string, unknown>;

const decodeBase64Url = (base64Url: string): string => {
  const base64 = base64Url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(base64Url.length + ((4 - (base64Url.length % 4)) % 4), "=");
  const binary = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

const decode = <T extends JwtPayload>(token: string): T => {
  // A JWT is three parts separated by dots: header.payload.signature
  const payloadBase64 = token.split(".")[1];

  if (!payloadBase64) {
    throw new Error("Invalid JWT token");
  }

  // The payload is Base64Url encoded, so decode it
  const decodedJson = decodeBase64Url(payloadBase64);
  return JSON.parse(decodedJson) as T;
};

export const jwt = {
  decode,
};
