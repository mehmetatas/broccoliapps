export type JwtPayload = {
  sub: string; // User ID
  exp: number; // epoch time in seconds
  iat: number; // epoch time in seconds
  iss: string;
  // not used
  // jti: string;
  // aud: string;
} & Record<string, unknown>;

const BASE64_LOOKUP: Record<string, number> = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("").forEach((char, i) => {
  BASE64_LOOKUP[char] = i;
});

const decodeBase64Url = (input: string): string => {
  const str = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  const padded = pad ? str + "=".repeat(4 - pad) : str;

  let output = "";
  for (let i = 0; i < padded.length; i += 4) {
    const a = BASE64_LOOKUP[padded[i]!]!;
    const b = BASE64_LOOKUP[padded[i + 1]!]!;
    const c = BASE64_LOOKUP[padded[i + 2]!];
    const d = BASE64_LOOKUP[padded[i + 3]!];

    output += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== undefined && padded[i + 2] !== "=") {
      output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    }
    if (d !== undefined && padded[i + 3] !== "=") {
      output += String.fromCharCode(((c! & 3) << 6) | d);
    }
  }

  return output;
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
